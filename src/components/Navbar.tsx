'use client';

import React, { useState, useEffect } from 'react';
import { VolcanoIcon, ActivityIcon, RadioIcon, RefreshCwIcon } from './Icons';

interface NavbarProps {
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
}

export default function Navbar({ onRefreshAll, isRefreshing = false }: NavbarProps) {
  const [wibTime, setWibTime] = useState<string>('');
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      // WIB = UTC+7
      const wibStr = now.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const utcStr = now.toLocaleTimeString('en-US', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setWibTime(`${wibStr} WIB`);
      setUtcTime(`${utcStr} UTC`);
    };

    updateClocks();
    const timer = setInterval(updateClocks, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand / System Title */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-red-950/60 border border-red-800/80 text-red-500 shadow-inner">
            <VolcanoIcon className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
                EARLY WARNING SYSTEM
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                v2.4-TACTICAL
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-1.5">
              <span>VOLCANO & ASH NAVIGATION TRACKER</span>
              <span className="text-zinc-500 text-xs hidden md:inline">|</span>
              <span className="text-xs text-zinc-400 font-normal hidden md:inline">
                Sistem Pemantauan Sebaran Abu Vulkanik Indonesia
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Live Station Status (Hidden on small mobile) */}
        <div className="hidden lg:flex items-center space-x-6 text-xs font-mono text-zinc-400">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-zinc-300 font-medium">STATUS: SIAGA BENCANA</span>
          </div>
          <div className="flex items-center space-x-2">
            <RadioIcon className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>METEOSAT & ECMWF SYNC</span>
          </div>
          <div className="flex items-center space-x-2">
            <ActivityIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>CAMS SO₂ TRACER</span>
          </div>
        </div>

        {/* Right: Telemetry Clocks & Refresh Button */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex flex-col items-end text-[11px] font-mono leading-tight">
            <span className="text-zinc-200 font-semibold">{wibTime || '--:--:-- WIB'}</span>
            <span className="text-zinc-500">{utcTime || '--:--:-- UTC'}</span>
          </div>

          {onRefreshAll && (
            <button
              onClick={onRefreshAll}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-zinc-100 transition-all flex items-center gap-1 text-xs font-mono disabled:opacity-50"
              title="Sinkronisasi data atmosfer dan kualitas udara"
            >
              <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Sinkronisasi</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
