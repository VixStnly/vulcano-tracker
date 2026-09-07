import { NextRequest, NextResponse } from 'next/server';
import { PRESET_CITIES } from '@/lib/volcanoes';
import { GeocodedLocation } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const normalizedQ = q.toLowerCase();

  // Match preset cities first
  const matchedPresets: GeocodedLocation[] = PRESET_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(normalizedQ) ||
      c.province.toLowerCase().includes(normalizedQ)
  ).map((c) => ({
    id: `preset-${c.name.toLowerCase().replace(/\s+/g, '-')}`,
    displayName: `${c.name}, ${c.province}, Indonesia`,
    shortName: c.name,
    latitude: c.lat,
    longitude: c.lon,
    type: c.type
  }));

  try {
    const encoded = encodeURIComponent(q);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encoded}&countrycodes=id&format=json&addressdetails=1&limit=6`;
    
    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'VolcanoAshTracker-Indonesia/1.0 (contact: support@volcanotracker.id)'
      }
    });

    if (res.ok) {
      const data = await res.json();
      const nominatimResults: GeocodedLocation[] = (data || []).map((item: any) => {
        const parts = (item.display_name || '').split(',');
        const shortName = parts[0]?.trim() || item.name;
        return {
          id: `osm-${item.place_id}`,
          displayName: item.display_name,
          shortName: shortName,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          type: item.type || item.addresstype || 'Lokasi'
        };
      });

      // Merge and deduplicate by proximity / name
      const combined = [...matchedPresets];
      for (const item of nominatimResults) {
        const exists = combined.some(
          (c) =>
            Math.abs(c.latitude - item.latitude) < 0.05 &&
            Math.abs(c.longitude - item.longitude) < 0.05
        );
        if (!exists) {
          combined.push(item);
        }
      }

      return NextResponse.json(combined.slice(0, 8));
    }
  } catch (error) {
    console.warn('Nominatim search failed, returning presets:', error);
  }

  return NextResponse.json(matchedPresets.slice(0, 8));
}
