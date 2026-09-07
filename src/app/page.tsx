'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import VolcanoSelector from '@/components/VolcanoSelector';
import LocationSearch from '@/components/LocationSearch';
import ImpactReport from '@/components/ImpactReport';
import AirQualityCard from '@/components/AirQualityCard';
import { INDONESIA_VOLCANOES } from '@/lib/volcanoes';
import {
  VolcanoData,
  WindAtmosphereData,
  AirQualityData,
  ImpactAssessment,
  VaacAdvisoryData
} from '@/lib/types';
import { assessLocationImpact } from '@/lib/geo-calculator';
import { WindIcon } from '@/components/Icons';

// Dynamic import of TacticalMap to avoid SSR issues with Leaflet
const TacticalMap = dynamic(() => import('@/components/TacticalMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[580px] sm:h-[650px] lg:h-[700px] rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center font-mono text-xs text-zinc-500">
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></span>
        <span>Memuat Peta Taktis Arah Angin & Sebaran Abu...</span>
      </div>
    </div>
  )
});

export default function Home() {
  // 1. Default to Gunung Anak Krakatau
  const [selectedVolcano, setSelectedVolcano] = useState<VolcanoData>(INDONESIA_VOLCANOES[0]);

  // 2. Default to Bogor
  const [targetLocation, setTargetLocation] = useState<{ name: string; lat: number; lon: number }>({
    name: 'Bogor',
    lat: -6.596356,
    lon: 106.797319
  });

  // State
  const [windData, setWindData] = useState<WindAtmosphereData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [vaacData, setVaacData] = useState<VaacAdvisoryData | null>(null);
  const [assessment, setAssessment] = useState<ImpactAssessment | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // Fetch live wind data (Open-Meteo ECMWF)
  const fetchWindData = useCallback(async (volcano: VolcanoData) => {
    try {
      const res = await fetch(`/api/weather?lat=${volcano.latitude}&lon=${volcano.longitude}`);
      if (res.ok) {
        const data = await res.json();
        setWindData(data);
      }
    } catch (err) {
      console.error('Failed to fetch wind data:', err);
    }
  }, []);

  // Fetch live air quality (Copernicus CAMS - SO2, PM2.5, PM10)
  const fetchAirQualityData = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await fetch(`/api/airquality?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        setAirQuality(data);
      }
    } catch (err) {
      console.error('Failed to fetch air quality data:', err);
    }
  }, []);

  // Fetch official VAAC Darwin advisory
  const fetchVaacData = useCallback(async (volcano: VolcanoData) => {
    try {
      const res = await fetch(`/api/vaac?volcano=${volcano.id}`);
      if (res.ok) {
        const data = await res.json();
        setVaacData(data);
      }
    } catch (err) {
      console.error('Failed to fetch VAAC data:', err);
    }
  }, []);

  // Re-assess spatial impact whenever inputs change
  useEffect(() => {
    const windDir = windData?.altitude850WindDirectionDeg ?? 195;
    const windSpeed = windData?.altitude850WindSpeedKmh ?? 22;

    const result = assessLocationImpact(
      selectedVolcano,
      targetLocation.lat,
      targetLocation.lon,
      targetLocation.name,
      windDir,
      windSpeed,
      vaacData
    );
    setAssessment(result);
  }, [selectedVolcano, targetLocation, windData, vaacData]);

  // Initial fetch on volcano selection
  useEffect(() => {
    fetchWindData(selectedVolcano);
    fetchVaacData(selectedVolcano);
  }, [selectedVolcano, fetchWindData, fetchVaacData]);

  // Fetch air quality when target location changes
  useEffect(() => {
    fetchAirQualityData(targetLocation.lat, targetLocation.lon);
  }, [targetLocation, fetchAirQualityData]);

  // Refresh all live feeds
  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    await Promise.all([
      fetchWindData(selectedVolcano),
      fetchAirQualityData(targetLocation.lat, targetLocation.lon),
      fetchVaacData(selectedVolcano)
    ]);
    setIsRefreshingAll(false);
  };

  // Map interactive click
  const handleMapClick = (lat: number, lon: number) => {
    setTargetLocation({
      name: `Titik (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
      lat,
      lon
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar onRefreshAll={handleRefreshAll} isRefreshing={isRefreshingAll} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Status notification bar */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span className="font-bold text-zinc-100">
              STATUS ERUPSI: {selectedVolcano.name.toUpperCase()} (LEVEL {selectedVolcano.statusLevel})
            </span>
            <span className="text-zinc-400 hidden sm:inline">•</span>
            <span className="text-zinc-400 hidden sm:inline">
              Data Resmi: VAAC Darwin & BMKG (Ketinggian abu ~4.6 km s/d ~15.2 km dpl)
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200">LIVE SYNC</span>
            <span>WMO • PVMBG • VAAC</span>
          </div>
        </div>

        {/* Core Layout: 2-Column Responsive Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Volcano Chooser, Search Bar, Impact Verdict, Air Quality */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. Pilih Gunung Berapi */}
            <VolcanoSelector
              selectedVolcano={selectedVolcano}
              onSelectVolcano={(volcano) => {
                setSelectedVolcano(volcano);
                if (volcano.defaultCity) {
                  setTargetLocation(volcano.defaultCity);
                }
              }}
            />

            {/* 2. Cari Kota / Kecamatan */}
            <LocationSearch
              currentLocation={targetLocation}
              onSelectLocation={(loc) => setTargetLocation(loc)}
            />

            {/* 3. Hasil Analisis Spasial Dampak Erupsi */}
            <ImpactReport
              assessment={assessment}
              volcano={selectedVolcano}
              windData={windData}
            />

            {/* 4. Kualitas Udara & Emisi Gas SO2 */}
            <AirQualityCard
              data={airQuality}
              locationName={targetLocation.name}
            />
          </div>

          {/* Right Column: Custom Interactive Tactical Map with Animated Wind & VAAC Layer */}
          <div className="lg:col-span-7 space-y-3 lg:sticky lg:top-20">
            <TacticalMap
              volcano={selectedVolcano}
              targetLocation={targetLocation}
              windData={windData}
              assessment={assessment}
              vaacData={vaacData}
              onMapClickLocation={handleMapClick}
            />

            {/* Map Explanatory Badge */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-400 font-mono space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                <WindIcon className="w-4 h-4 text-cyan-400" />
                <span>Peta Interaktif Arah Angin & Sebaran Abu Vulkanik</span>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Garis biru beranimasi menunjukkan vektor aliran arah angin atmosfer (lapisan 850 hPa). Poligon merah transparan adalah area sebaran abu vulkanik resmi yang dirilis oleh <strong>VAAC Darwin</strong> (Bureau of Meteorology Australia). Klik langsung di peta untuk memeriksa status titik manapun secara instan.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 text-center text-xs font-mono text-zinc-500">
        Sistem Pemantauan Sebaran Abu Vulkanik & Navigasi Erupsi • Sumber Data: VAAC Darwin, PVMBG ESDM, BMKG & Copernicus CAMS
      </footer>
    </div>
  );
}
