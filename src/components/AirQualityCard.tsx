'use client';

import React from 'react';
import { AirQualityData } from '@/lib/types';
import { ActivityIcon, AlertTriangleIcon, InfoIcon } from './Icons';

interface AirQualityCardProps {
  data: AirQualityData | null;
  locationName: string;
  isLoading?: boolean;
}

export default function AirQualityCard({
  data,
  locationName,
  isLoading = false
}: AirQualityCardProps) {
  if (isLoading) {
    return (
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-lg animate-pulse space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-16 bg-zinc-800 rounded"></div>
          <div className="h-16 bg-zinc-800 rounded"></div>
          <div className="h-16 bg-zinc-800 rounded"></div>
          <div className="h-16 bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Evaluate SO2 level
  // WHO guideline: 24-hr mean 40 ug/m3, 10-min 500 ug/m3
  let so2Status = 'NORMAL';
  let so2Color = 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40';
  if (data.so2 > 80) {
    so2Status = 'BAHAYA (KONSENTRASI TINGGI)';
    so2Color = 'text-red-400 border-red-800/80 bg-red-950/60';
  } else if (data.so2 > 35) {
    so2Status = 'WASPADA (TERDETEKSI EMISI)';
    so2Color = 'text-amber-400 border-amber-800/80 bg-amber-950/60';
  }

  // Evaluate PM2.5 level
  let pm25Status = 'BAIK';
  let pm25Color = 'text-emerald-400';
  if (data.pm25 > 55) {
    pm25Status = 'TIDAK SEHAT';
    pm25Color = 'text-red-400';
  } else if (data.pm25 > 25) {
    pm25Status = 'SEDANG';
    pm25Color = 'text-amber-400';
  }

  // Evaluate AQI
  let aqiStatus = 'BAIK';
  let aqiColor = 'text-emerald-400';
  if (data.europeanAqi > 100) {
    aqiStatus = 'BURUK / BERBAHAYA';
    aqiColor = 'text-red-400';
  } else if (data.europeanAqi > 50) {
    aqiStatus = 'SEDANG';
    aqiColor = 'text-amber-400';
  }

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ActivityIcon className="w-5 h-5 text-purple-400" />
          <span className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
            KUALITAS UDARA & EMISI AEROSOL VULKANIK ({locationName.toUpperCase()})
          </span>
        </div>
        <div className="text-[11px] font-mono text-zinc-500">
          Sensor Copernicus CAMS Real-Time
        </div>
      </div>

      {/* Grid of Key Pollutants */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* SO2 Indicator (Primary Volcanic Tracer) */}
        <div className={`border rounded-lg p-3 ${so2Color} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider">SO₂ (SULFUR DIOKSIDA)</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 font-mono">GAS VOLCANO</span>
            </div>
            <div className="mt-1 text-xl font-mono font-bold">
              {data.so2}{' '}
              <span className="text-xs font-normal opacity-70">µg/m³</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] font-mono font-semibold uppercase truncate">
            {so2Status}
          </div>
        </div>

        {/* PM2.5 (Fine Particulates) */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] font-mono">PM2.5 (ABU HALUS)</span>
            </div>
            <div className="mt-1 text-xl font-mono font-bold text-zinc-100">
              {data.pm25}{' '}
              <span className="text-xs text-zinc-500 font-normal">µg/m³</span>
            </div>
          </div>
          <div className={`mt-2 text-[10px] font-mono font-semibold ${pm25Color}`}>
            Status: {pm25Status}
          </div>
        </div>

        {/* PM10 (Silica Dust / Ash Particles) */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] font-mono">PM10 (DEBU SILIKA)</span>
            </div>
            <div className="mt-1 text-xl font-mono font-bold text-zinc-100">
              {data.pm10}{' '}
              <span className="text-xs text-zinc-500 font-normal">µg/m³</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] font-mono text-zinc-400">
            Debu: {data.dust} µg/m³
          </div>
        </div>

        {/* European AQI Index */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] font-mono">INDEX AQI</span>
            </div>
            <div className="mt-1 text-xl font-mono font-bold text-zinc-100">
              {data.europeanAqi}
            </div>
          </div>
          <div className={`mt-2 text-[10px] font-mono font-semibold ${aqiColor}`}>
            {aqiStatus}
          </div>
        </div>
      </div>

      {/* Explanatory Note */}
      <div className="flex items-start gap-2 text-[11px] text-zinc-400 bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-2.5">
        <InfoIcon className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
        <span>
          <strong className="text-zinc-300">Catatan Ilmiah:</strong> Gas Sulfur Dioksida ($SO_2$) adalah indikator gas magma paling representatif saat erupsi. Konsentrasi di atas 50 µg/m³ dapat memicu iritasi saluran pernapasan, mata perih, dan bau belerang menyengat.
        </span>
      </div>
    </div>
  );
}
