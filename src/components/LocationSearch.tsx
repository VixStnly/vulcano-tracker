'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GeocodedLocation } from '@/lib/types';
import { PRESET_CITIES } from '@/lib/volcanoes';
import { SearchIcon, MapPinIcon, CrosshairIcon } from './Icons';

interface LocationSearchProps {
  currentLocation: { name: string; lat: number; lon: number };
  onSelectLocation: (loc: { name: string; lat: number; lon: number }) => void;
  isLoading?: boolean;
}

export default function LocationSearch({
  currentLocation,
  onSelectLocation,
  isLoading = false
}: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Quick presets to show as interactive pills
  const featuredPresets = [
    { name: 'Bogor', lat: -6.596356, lon: 106.797319 },
    { name: 'Anyer', lat: -6.052600, lon: 105.929800 },
    { name: 'Cilegon', lat: -6.017399, lon: 106.053818 },
    { name: 'Bandar Lampung', lat: -5.429741, lon: 105.262520 },
    { name: 'Kalianda', lat: -5.733500, lon: 105.591200 },
    { name: 'Serang', lat: -6.110375, lon: 106.163986 },
    { name: 'Jakarta Pusat', lat: -6.175392, lon: 106.827153 }
  ];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced geocoding search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Geocode search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (loc: { name: string; lat: number; lon: number }) => {
    onSelectLocation(loc);
    setQuery('');
    setShowDropdown(false);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-3.5" ref={wrapperRef}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CrosshairIcon className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
            TARGET PEMERIKSAAN DAMPAK (KOTA / KECAMATAN)
          </span>
        </div>
        <div className="text-[11px] font-mono text-zinc-500">
          OSM & PVMBG GIS
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <SearchIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setShowDropdown(true);
            }}
            placeholder="Ketik nama kota atau kecamatan (contoh: Bogor, Anyer, Kalianda, Serang)..."
            className="w-full bg-zinc-950 border border-zinc-700/80 hover:border-zinc-500 focus:border-cyan-500 rounded-lg pl-10 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans transition-all"
          />
          {isSearching && (
            <div className="absolute right-3 flex items-center">
              <span className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full"></span>
            </div>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-950 border border-zinc-700 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-zinc-800/80">
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  handleSelect({
                    name: item.shortName || item.displayName.split(',')[0],
                    lat: item.latitude,
                    lon: item.longitude
                  })
                }
                className="w-full text-left px-4 py-2.5 hover:bg-zinc-900 flex items-start gap-2.5 text-xs transition-colors"
              >
                <MapPinIcon className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="flex-1 truncate">
                  <div className="font-medium text-zinc-100 truncate">{item.displayName}</div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    {item.latitude.toFixed(4)}°, {item.longitude.toFixed(4)}° • Tipe: {item.type}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Select Presets */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[11px] font-mono text-zinc-500 mr-1">Rekomendasi Cepat:</span>
        {featuredPresets.map((city) => {
          const isSelected = currentLocation.name.toLowerCase().includes(city.name.toLowerCase());
          return (
            <button
              key={city.name}
              onClick={() => handleSelect(city)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
                isSelected
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm font-semibold'
                  : 'bg-zinc-950/80 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              📍 {city.name}
            </button>
          );
        })}
      </div>

      {/* Current Active Location Info Badge */}
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg px-3.5 py-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-zinc-400">LOKASI AKTIF:</span>
          <span className="text-zinc-100 font-bold tracking-wide">{currentLocation.name}</span>
        </div>
        <div className="text-zinc-500 text-[11px]">
          {currentLocation.lat.toFixed(4)}°, {currentLocation.lon.toFixed(4)}°
        </div>
      </div>
    </div>
  );
}
