'use client';

import React, { useEffect, useRef, useState } from 'react';
import { VolcanoData, WindAtmosphereData, ImpactAssessment, VaacAdvisoryData } from '@/lib/types';
import {
  generatePlumePolygon,
  calculateDestinationPoint,
  degToIndonesianCardinal
} from '@/lib/geo-calculator';
import { LayersIcon, CrosshairIcon, WindIcon, CompassIcon } from './Icons';

interface TacticalMapProps {
  volcano: VolcanoData;
  targetLocation: { name: string; lat: number; lon: number };
  windData: WindAtmosphereData | null;
  assessment: ImpactAssessment | null;
  vaacData?: VaacAdvisoryData | null;
  onMapClickLocation?: (lat: number, lon: number) => void;
}

export default function TacticalMap({
  volcano,
  targetLocation,
  windData,
  assessment,
  vaacData,
  onMapClickLocation
}: TacticalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [showPlumeCone, setShowPlumeCone] = useState(true);
  const [showVaacPolygon, setShowVaacPolygon] = useState(true);
  const [showKrb, setShowKrb] = useState(true);
  const [showWindFlow, setShowWindFlow] = useState(true);

  // Initialize Leaflet Map
  useEffect(() => {
    let checkTimer: any;

    const initMap = () => {
      if (typeof window === 'undefined' || !(window as any).L || !mapContainerRef.current) {
        return;
      }

      const L = (window as any).L;

      if (mapInstanceRef.current) {
        return;
      }

      const centerLat = (volcano.latitude + targetLocation.lat) / 2;
      const centerLon = (volcano.longitude + targetLocation.lon) / 2;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLon],
        zoom: 8,
        zoomControl: false,
        attributionControl: false
      });

      // High-contrast dark OpenStreetMap tiles (zero watermark, zero api key, sharp coastlines & cities)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        className: 'tactical-dark-tiles',
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      L.control.zoom({ position: 'topleft' }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      map.on('click', (e: any) => {
        if (onMapClickLocation) {
          onMapClickLocation(e.latlng.lat, e.latlng.lng);
        }
      });

      setMapReady(true);
    };

    if (typeof window !== 'undefined') {
      if ((window as any).L) {
        initMap();
      } else {
        checkTimer = setInterval(() => {
          if ((window as any).L) {
            clearInterval(checkTimer);
            initMap();
          }
        }, 100);
      }
    }

    return () => {
      if (checkTimer) clearInterval(checkTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Overlays whenever dependencies change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !layerGroupRef.current) {
      return;
    }

    const L = (window as any).L;
    const layerGroup = layerGroupRef.current;
    const map = mapInstanceRef.current;

    layerGroup.clearLayers();

    const windDir = windData?.altitude850WindDirectionDeg ?? 195;
    const windSpeed = windData?.altitude850WindSpeedKmh ?? 22;
    const windTowardsDeg = (windDir + 180) % 360;

    // 1. Official VAAC Darwin Advisory Observation Polygon
    if (showVaacPolygon && vaacData && vaacData.obs_layers) {
      vaacData.obs_layers.forEach((layer) => {
        if (layer.points && layer.points.length >= 3) {
          const vaacPoly = L.polygon(layer.points, {
            color: '#ef4444',
            weight: 2,
            fillColor: '#ea580c',
            fillOpacity: 0.28
          }).addTo(layerGroup);

          vaacPoly.bindPopup(`
            <div class="font-mono text-xs p-1">
              <strong class="text-red-400 block text-sm">POLIGON RESMI VAAC DARWIN</strong>
              <span class="text-zinc-200">Lapisan: <strong>${layer.fl_label}</strong></span><br/>
              <span class="text-amber-400 text-[11px]">${vaacData.eruption_details || ''}</span>
            </div>
          `);
        }
      });
    }

    // 2. Dynamic Ash Plume Dispersion Cone
    if (showPlumeCone) {
      const plumePoints = generatePlumePolygon(
        volcano.latitude,
        volcano.longitude,
        windDir,
        windSpeed,
        volcano.columnHeightMeters
      );

      const plumePoly = L.polygon(plumePoints, {
        color: '#f97316',
        weight: 1.5,
        dashArray: '5, 5',
        fillColor: '#ea580c',
        fillOpacity: 0.25
      }).addTo(layerGroup);

      plumePoly.bindPopup(`
        <div class="font-mono text-xs p-1">
          <strong class="text-orange-400 block text-sm">KERUCUT SEBARAN ANGIN</strong>
          <span class="text-zinc-300">Sumber: ${volcano.name}</span><br/>
          <span class="text-zinc-400">Arah Angin: ${windDir}° (${windSpeed} km/j)</span>
        </div>
      `);
    }

    // 3. Primary KRB Buffer Ring (Kawasan Rawan Bencana)
    if (showKrb) {
      const krbCircle = L.circle([volcano.latitude, volcano.longitude], {
        radius: volcano.krbRadiusKm * 1000,
        color: '#dc2626',
        weight: 2,
        fillColor: '#dc2626',
        fillOpacity: 0.25,
        dashArray: '4, 6'
      }).addTo(layerGroup);

      krbCircle.bindPopup(`
        <div class="font-mono text-xs p-1">
          <strong class="text-red-400 block text-sm">KAWASAN RAWAN BENCANA (KRB)</strong>
          <span class="text-zinc-300">Radius Bahaya: ${volcano.krbRadiusKm} km dari kawah</span>
        </div>
      `);
    }

    // 4. ANIMATED WIND STREAMLINES & DIRECTIONAL FLOW ARROWS (ARAH ANGIN BERGERAK)
    if (showWindFlow) {
      // Streamline lines radiating downwind along wind vector
      const streamlineDistances = [35, 75, 125, 185, 250];
      const lateralAngles = [-20, -10, 0, 10, 20];

      lateralAngles.forEach((offsetAngle) => {
        const streamBearing = (windTowardsDeg + offsetAngle + 360) % 360;
        const linePoints: [number, number][] = [
          [volcano.latitude, volcano.longitude]
        ];

        [30, 70, 120, 180, 240, 300].forEach((dist) => {
          linePoints.push(
            calculateDestinationPoint(volcano.latitude, volcano.longitude, dist, streamBearing)
          );
        });

        // Flowing dashed streamline line
        L.polyline(linePoints, {
          color: '#38bdf8',
          weight: offsetAngle === 0 ? 3 : 1.8,
          opacity: offsetAngle === 0 ? 0.85 : 0.55,
          className: 'wind-streamline-animated'
        }).addTo(layerGroup);
      });

      // Animated directional wind arrows across multiple streamline tracks
      const arrowTracks = [-12, 0, 12];
      const arrowDistances = [45, 95, 155, 220];

      arrowTracks.forEach((trackAngle) => {
        const trackBearing = (windTowardsDeg + trackAngle + 360) % 360;
        arrowDistances.forEach((dist) => {
          const arrowCoord = calculateDestinationPoint(
            volcano.latitude,
            volcano.longitude,
            dist,
            trackBearing
          );

          const arrowIcon = L.divIcon({
            className: 'wind-arrow-marker',
            html: `
              <div style="transform: rotate(${trackBearing}deg);" class="flex items-center justify-center wind-particle-pulse">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.9));">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          L.marker(arrowCoord, { icon: arrowIcon, interactive: false }).addTo(layerGroup);
        });
      });
    }

    // 5. Volcano Crater Summit Marker (with pulsing radar ring)
    const volcanoIcon = L.divIcon({
      className: 'volcano-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-9 h-9 rounded-full bg-red-600/40 radar-ring"></div>
          <div class="w-7 h-7 rounded-full bg-zinc-950 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-xl z-10">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="m2 22 7-15 3 4 3-4 7 15H2Z" />
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const volcanoMarker = L.marker([volcano.latitude, volcano.longitude], {
      icon: volcanoIcon
    }).addTo(layerGroup);

    volcanoMarker.bindPopup(`
      <div class="font-mono text-xs p-1 space-y-1">
        <div class="text-red-400 font-bold text-sm">${volcano.name}</div>
        <div class="text-zinc-300">Status: <strong>LEVEL ${volcano.statusLevel} (${volcano.statusText})</strong></div>
        <div class="text-zinc-400">Elevasi: ${volcano.elevationMeters} m dpl</div>
        <div class="text-zinc-400">Radius KRB: ${volcano.krbRadiusKm} km</div>
      </div>
    `);

    // 6. Target Location Pin Marker
    const targetSeverityColor = assessment?.severityColor || '#22c55e';
    const targetIcon = L.divIcon({
      className: 'target-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-7 h-7 rounded-full bg-zinc-950 border-2 flex items-center justify-center shadow-lg" style="border-color: ${targetSeverityColor}; color: ${targetSeverityColor};">
            <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${targetSeverityColor};"></div>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const targetMarker = L.marker([targetLocation.lat, targetLocation.lon], {
      icon: targetIcon
    }).addTo(layerGroup);

    targetMarker.bindPopup(`
      <div class="font-mono text-xs p-1 space-y-1">
        <div class="text-cyan-400 font-bold text-sm">${targetLocation.name}</div>
        <div class="text-zinc-300">Status: <strong style="color: ${targetSeverityColor};">${assessment?.severityLabel || 'Aktif'}</strong></div>
        <div class="text-zinc-400">Jarak: ${assessment?.distanceKm || '--'} km dari kawah</div>
      </div>
    `);

    // 7. Measurement Trajectory Line (Volcano -> Target)
    L.polyline(
      [
        [volcano.latitude, volcano.longitude],
        [targetLocation.lat, targetLocation.lon]
      ],
      {
        color: targetSeverityColor,
        weight: 2.5,
        opacity: 0.85,
        dashArray: '6, 6'
      }
    ).addTo(layerGroup);

    // Fit map bounds smoothly
    const latLngs: [number, number][] = [
      [volcano.latitude, volcano.longitude],
      [targetLocation.lat, targetLocation.lon]
    ];
    if (showVaacPolygon && vaacData?.obs_layers?.[0]?.points) {
      vaacData.obs_layers[0].points.forEach((p) => latLngs.push(p));
    }
    map.fitBounds(L.latLngBounds(latLngs).pad(0.2));
  }, [
    volcano,
    targetLocation,
    windData,
    assessment,
    vaacData,
    mapReady,
    showPlumeCone,
    showVaacPolygon,
    showKrb,
    showWindFlow
  ]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const L = (window as any).L;
    const latLngs: [number, number][] = [
      [volcano.latitude, volcano.longitude],
      [targetLocation.lat, targetLocation.lon]
    ];
    mapInstanceRef.current.fitBounds(L.latLngBounds(latLngs).pad(0.25));
  };

  const windDir = windData?.altitude850WindDirectionDeg ?? 195;
  const windSpeed = windData?.altitude850WindSpeedKmh ?? 22;
  const windTowardsDeg = (windDir + 180) % 360;
  const windTowardsCardinal = degToIndonesianCardinal(windTowardsDeg);

  return (
    <div className="relative w-full h-[580px] sm:h-[650px] lg:h-[700px] rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950 flex flex-col">
      {/* Top Floating Map Controls */}
      <div className="z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 text-zinc-400 text-[11px] mr-1">
            <LayersIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span>LAPISAN:</span>
          </div>

          {/* Toggle Arah Angin Bergerak */}
          <button
            onClick={() => setShowWindFlow(!showWindFlow)}
            className={`px-2 py-1 rounded transition-all text-[11px] flex items-center gap-1 ${
              showWindFlow
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 font-bold shadow'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <WindIcon className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Arah Angin Bergerak</span>
          </button>

          {/* Toggle Poligon VAAC */}
          <button
            onClick={() => setShowVaacPolygon(!showVaacPolygon)}
            className={`px-2 py-1 rounded transition-all text-[11px] ${
              showVaacPolygon
                ? 'bg-red-950 text-red-300 border border-red-600 font-bold shadow'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            🔴 Poligon VAAC Darwin
          </button>

          {/* Toggle Kerucut Abu */}
          <button
            onClick={() => setShowPlumeCone(!showPlumeCone)}
            className={`px-2 py-1 rounded transition-all text-[11px] ${
              showPlumeCone
                ? 'bg-orange-950 text-orange-300 border border-orange-600 font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Kerucut Abu
          </button>

          {/* Toggle KRB */}
          <button
            onClick={() => setShowKrb(!showKrb)}
            className={`px-2 py-1 rounded transition-all text-[11px] ${
              showKrb
                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Radius KRB
          </button>
        </div>

        {/* Recenter button */}
        <button
          onClick={handleRecenter}
          className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
          title="Fokuskan kembali posisi kawah dan kota"
        >
          <CrosshairIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Main Map Container */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* FLOATING TACTICAL WIND DIRECTION COMPASS HUD (POJOK KANAN ATAS) */}
        <div className="absolute top-3 right-3 z-10 bg-zinc-950/90 backdrop-blur border border-cyan-800/80 rounded-lg p-2.5 shadow-2xl font-mono text-xs flex items-center gap-3">
          {/* Animated Rotating Compass Dial */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 border border-cyan-500/60 shadow-inner shrink-0">
            <div
              style={{ transform: `rotate(${windTowardsDeg}deg)` }}
              className="transition-transform duration-700 flex flex-col items-center justify-center"
            >
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[14px] border-b-cyan-400"></div>
              <div className="w-0.5 h-3 bg-cyan-400"></div>
            </div>
            <div className="absolute top-0 text-[8px] font-bold text-zinc-400">U</div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              <WindIcon className="w-3 h-3" />
              <span>ARAH HEMBUSAN ANGIN</span>
            </div>
            <div className="text-sm font-black text-white">
              Menuju {windTowardsCardinal} ({windTowardsDeg}°)
            </div>
            <div className="text-[10px] text-zinc-400">
              Kecepatan: <strong className="text-zinc-200">{windSpeed} km/j</strong> (Lapisan 850 hPa)
            </div>
          </div>
        </div>

        {/* Tactical Legend Overlay (Pojok Kiri Bawah) */}
        <div className="absolute bottom-3 left-3 z-10 bg-zinc-950/95 backdrop-blur border border-zinc-800 p-2.5 rounded-lg shadow-xl font-mono text-[10px] space-y-1.5 hidden sm:block pointer-events-none">
          <div className="text-zinc-400 font-bold uppercase border-b border-zinc-800 pb-1">
            LEGENDA PETA TAKTIS
          </div>
          <div className="flex items-center gap-2 text-zinc-200">
            <span className="w-3 h-2 border border-red-500 bg-red-600/40"></span>
            <span>Poligon Sebaran Abu Resmi (VAAC Darwin)</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-300">
            <span className="w-3 h-0.5 border-b-2 border-cyan-400 border-dashed"></span>
            <span>Garis Aliran Arah Angin Bergerak</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Kawah Pusat Erupsi ({volcano.name})</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-cyan-400"></span>
            <span>Lokasi Target ({targetLocation.name})</span>
          </div>
        </div>

        {/* Interactive Click Notice */}
        <div className="absolute bottom-2 right-3 sm:right-auto sm:bottom-3 sm:left-1/2 sm:-translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-black/80 backdrop-blur text-[10px] font-mono text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 shadow-lg">
            Klik titik manapun di peta untuk memeriksa lokasi kustom
          </div>
        </div>
      </div>
    </div>
  );
}
