'use client';

import React from 'react';
import { INDONESIA_VOLCANOES } from '@/lib/volcanoes';
import { VolcanoData } from '@/lib/types';
import { VolcanoIcon, ChevronDownIcon, AlertTriangleIcon } from './Icons';

interface VolcanoSelectorProps {
  selectedVolcano: VolcanoData;
  onSelectVolcano: (volcano: VolcanoData) => void;
}

export default function VolcanoSelector({
  selectedVolcano,
  onSelectVolcano
}: VolcanoSelectorProps) {
  const getStatusBadge = (level: number, text: string) => {
    switch (level) {
      case 4:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/80 border border-red-600/80 text-red-400 text-xs font-mono font-bold tracking-wide">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
            LEVEL IV - {text}
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-950/80 border border-orange-600/80 text-orange-400 text-xs font-mono font-bold tracking-wide">
            <span className="h-2 w-2 rounded-full bg-orange-500"></span>
            LEVEL III - {text}
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/80 border border-amber-600/80 text-amber-400 text-xs font-mono font-bold tracking-wide">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            LEVEL II - {text}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-600/80 text-emerald-400 text-xs font-mono font-bold tracking-wide">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            LEVEL I - {text}
          </span>
        );
    }
  };

  const getVonaBadge = (code: string) => {
    const colors: Record<string, string> = {
      RED: 'bg-red-600 text-white',
      ORANGE: 'bg-orange-600 text-white',
      YELLOW: 'bg-amber-500 text-black font-semibold',
      GREEN: 'bg-emerald-600 text-white'
    };
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${colors[code] || 'bg-zinc-700'}`}>
        VONA: {code}
      </span>
    );
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <VolcanoIcon className="w-5 h-5 text-red-500" />
          <span className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
            PILIH SUMBER ERUPSI (GUNUNG API)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(selectedVolcano.statusLevel, selectedVolcano.statusText)}
          {getVonaBadge(selectedVolcano.vonaColorCode)}
        </div>
      </div>

      {/* Select Dropdown */}
      <div className="relative">
        <select
          value={selectedVolcano.id}
          onChange={(e) => {
            const found = INDONESIA_VOLCANOES.find((v) => v.id === e.target.value);
            if (found) onSelectVolcano(found);
          }}
          className="w-full appearance-none bg-zinc-950 border border-zinc-700/80 hover:border-zinc-500 rounded-lg px-4 py-3 text-sm font-medium text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors pr-10 cursor-pointer"
        >
          {INDONESIA_VOLCANOES.map((volcano) => (
            <option key={volcano.id} value={volcano.id} className="bg-zinc-900 text-zinc-100 py-2">
              {volcano.name} — {volcano.regionalLocation}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="w-5 h-5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Quick Specs Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-mono">
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2.5">
          <span className="text-zinc-500 block text-[10px]">KOORDINAT KAWAH</span>
          <span className="text-zinc-200 font-semibold">
            {selectedVolcano.latitude.toFixed(3)}°, {selectedVolcano.longitude.toFixed(3)}°
          </span>
        </div>
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2.5">
          <span className="text-zinc-500 block text-[10px]">ELEVASI PUNCAK</span>
          <span className="text-zinc-200 font-semibold">{selectedVolcano.elevationMeters} m dpl</span>
        </div>
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2.5">
          <span className="text-zinc-500 block text-[10px]">RADIUS KRB UTAMA</span>
          <span className="text-red-400 font-semibold">{selectedVolcano.krbRadiusKm} km dari kawah</span>
        </div>
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2.5">
          <span className="text-zinc-500 block text-[10px]">ESTIMASI KOLOM ABU</span>
          <span className="text-amber-400 font-semibold">~{selectedVolcano.columnHeightMeters} m</span>
        </div>
      </div>

      {/* Official Situation Brief */}
      <div className="text-xs text-zinc-400 bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-3 space-y-1.5 leading-relaxed">
        <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
          <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-500" />
          <span>Laporan PVMBG & Pos Pengamatan:</span>
        </div>
        <p className="text-zinc-300">{selectedVolcano.aviationSummary}</p>
        <p className="text-zinc-500 text-[11px]">
          Pos Pantau: <span className="text-zinc-400">{selectedVolcano.monitoringPost}</span> | Pembaruan: {selectedVolcano.lastEruptionDate}
        </p>
      </div>
    </div>
  );
}
