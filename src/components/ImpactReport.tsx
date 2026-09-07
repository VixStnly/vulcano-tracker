'use client';

import React from 'react';
import { ImpactAssessment, VolcanoData, WindAtmosphereData } from '@/lib/types';
import {
  AlertTriangleIcon,
  ShieldCheckIcon,
  WindIcon,
  CompassIcon,
  VolcanoIcon,
  MapPinIcon
} from './Icons';

interface ImpactReportProps {
  assessment: ImpactAssessment | null;
  volcano: VolcanoData;
  windData: WindAtmosphereData | null;
  isLoading?: boolean;
}

export default function ImpactReport({
  assessment,
  volcano,
  windData,
  isLoading = false
}: ImpactReportProps) {
  if (isLoading) {
    return (
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-xl animate-pulse space-y-4">
        <div className="h-6 bg-zinc-800 rounded w-1/2"></div>
        <div className="h-24 bg-zinc-800 rounded"></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-zinc-800 rounded"></div>
          <div className="h-16 bg-zinc-800 rounded"></div>
          <div className="h-16 bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return null;
  }

  const getSeverityBadge = () => {
    switch (assessment.severity) {
      case 'KRB_EXTREME':
        return {
          bg: 'bg-red-950/90 border-red-600 text-red-300',
          indicator: 'bg-red-500',
          icon: <AlertTriangleIcon className="w-6 h-6 text-red-500 animate-bounce" />
        };
      case 'SEVERE':
        return {
          bg: 'bg-red-950/90 border-red-500 text-red-200',
          indicator: 'bg-red-500',
          icon: <AlertTriangleIcon className="w-6 h-6 text-red-400 animate-pulse" />
        };
      case 'MODERATE':
        return {
          bg: 'bg-orange-950/80 border-orange-500 text-orange-200',
          indicator: 'bg-orange-500',
          icon: <AlertTriangleIcon className="w-6 h-6 text-orange-400" />
        };
      case 'LIGHT_ALERT':
        return {
          bg: 'bg-yellow-950/70 border-yellow-500 text-yellow-200',
          indicator: 'bg-yellow-400',
          icon: <WindIcon className="w-6 h-6 text-yellow-400" />
        };
      case 'SAFE':
      default:
        return {
          bg: 'bg-emerald-950/70 border-emerald-500 text-emerald-200',
          indicator: 'bg-emerald-500',
          icon: <ShieldCheckIcon className="w-6 h-6 text-emerald-400" />
        };
    }
  };

  const badgeConfig = getSeverityBadge();

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 sm:p-6 shadow-xl space-y-5">
      {/* Header with Live Status Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
        <div>
          <span className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase block">
            HASIL ANALISIS DAMPAK SPASIAL ERUPSI
          </span>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mt-0.5">
            <span className="text-red-400">{volcano.name}</span>
            <span className="text-zinc-500 font-normal">→</span>
            <span className="text-cyan-400">{assessment.targetName}</span>
          </h2>
        </div>

        <div className="text-[11px] font-mono text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 self-start sm:self-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
          <span>DATA: VAAC Darwin & ECMWF Met</span>
        </div>
      </div>

      {/* Main Verdict Card */}
      <div className={`p-4 sm:p-5 rounded-xl border ${badgeConfig.bg} shadow-lg transition-all`}>
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-black/40 shrink-0">
            {badgeConfig.icon}
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${badgeConfig.indicator} animate-ping`}></span>
              <span className="text-xs font-mono tracking-wider uppercase font-bold">
                KESIMPULAN STATUS DAMPAK
              </span>
              {assessment.isInsideVaacPolygon && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white font-mono font-bold tracking-wide">
                  LIVE VAAC DARWIN HIT
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
              {assessment.severityLabel}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed opacity-95">
              {assessment.summaryReason}
            </p>
          </div>
        </div>
      </div>

      {/* Telemetry Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono text-xs">
        {/* Distance */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px]">
            <MapPinIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>JARAK KE KAWAH</span>
          </div>
          <div className="text-base font-bold text-zinc-100 mt-1">
            {assessment.distanceKm}{' '}
            <span className="text-xs font-normal text-zinc-500">km</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Garis Lurus (Geodesic)</div>
        </div>

        {/* Bearing */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px]">
            <CompassIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>AZIMUTH LOKASI</span>
          </div>
          <div className="text-base font-bold text-zinc-100 mt-1">
            {assessment.bearingDeg}°
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
            {assessment.bearingCardinal}
          </div>
        </div>

        {/* VAAC Polygon Status */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px]">
            <VolcanoIcon className="w-3.5 h-3.5 text-red-400" />
            <span>POLIGON VAAC DARWIN</span>
          </div>
          <div className="text-base font-bold mt-1">
            {assessment.isInsideVaacPolygon ? (
              <span className="text-red-400">TERKENA SEBARAN</span>
            ) : (
              <span className="text-emerald-400">DILUAR POLIGON</span>
            )}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
            {assessment.vaacHitLayerLabel || 'Lapisan Permukaan / Aman'}
          </div>
        </div>

        {/* Multi-altitude Advisory */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px]">
            <WindIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>KETINGGIAN ABU</span>
          </div>
          <div className="text-base font-bold text-zinc-100 mt-1">
            FL150 - FL500
          </div>
          <div className="text-[10px] text-blue-400 mt-0.5 truncate">
            ~4.6 km s/d ~15.2 km dpl
          </div>
        </div>
      </div>

      {/* Atmospheric Wind Telemetry Brief */}
      {windData && (
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <WindIcon className="w-4 h-4 text-blue-400" />
            <span className="text-zinc-400">VEKTOR ANGIN LOKAL (OPEN-METEO ECMWF):</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-300">
            <span>
              Permukaan (10m):{' '}
              <strong className="text-zinc-100">{windData.surfaceWindSpeedKmh} km/j</strong> (dari{' '}
              {windData.surfaceWindDirectionDeg}°)
            </span>
            <span>
              Troposfer Bawah (850 hPa):{' '}
              <strong className="text-zinc-100">{windData.altitude850WindSpeedKmh} km/j</strong> (dari{' '}
              {windData.altitude850WindDirectionDeg}°)
            </span>
            <span>
              Suhu: <strong className="text-zinc-100">{windData.temperatureC}°C</strong>
            </span>
          </div>
        </div>
      )}

      {/* Official Health Mitigation */}
      <div className="space-y-2">
        <h4 className="text-xs font-mono font-semibold tracking-wider text-zinc-300 uppercase flex items-center gap-2">
          <span>PANDUAN MITIGASI & PROTOKOL KESEHATAN RESMI (PVMBG / KEMENKES):</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {assessment.healthAdvice.map((advice, idx) => (
            <div
              key={idx}
              className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-2.5 text-xs text-zinc-300 flex items-start gap-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0 mt-1.5"></span>
              <span className="leading-relaxed">{advice}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Aviation Notice (VONA / ICAO) */}
      <div className="text-xs font-mono bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-zinc-400 flex items-start gap-2.5">
        <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold text-[10px] shrink-0">
          VAAC DARWIN / NOTAM
        </span>
        <span className="leading-relaxed">{assessment.aviationNotice}</span>
      </div>
    </div>
  );
}
