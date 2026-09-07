import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  try {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=wind_speed_850hPa,wind_direction_850hPa&timezone=auto`;
    
    const res = await fetch(apiUrl, {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'User-Agent': 'VolcanoAshTracker/1.0'
      }
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }

    const data = await res.json();
    const current = data.current || {};
    const hourly = data.hourly || {};

    // Get the latest 850hPa wind (which represents volcanic ash transport layer)
    const latest850Speed = hourly.wind_speed_850hPa && hourly.wind_speed_850hPa.length > 0
      ? hourly.wind_speed_850hPa[0]
      : (current.wind_speed_10m || 15);
    const latest850Dir = hourly.wind_direction_850hPa && hourly.wind_direction_850hPa.length > 0
      ? hourly.wind_direction_850hPa[0]
      : (current.wind_direction_10m || 180);

    return NextResponse.json({
      time: current.time || new Date().toISOString(),
      surfaceWindSpeedKmh: Math.round((current.wind_speed_10m ?? 16.5) * 10) / 10,
      surfaceWindDirectionDeg: Math.round(current.wind_direction_10m ?? 180),
      altitude850WindSpeedKmh: Math.round(latest850Speed * 10) / 10,
      altitude850WindDirectionDeg: Math.round(latest850Dir),
      temperatureC: Math.round((current.temperature_2m ?? 28) * 10) / 10,
      humidityPercent: Math.round(current.relative_humidity_2m ?? 75),
      source: 'Open-Meteo WMO / ECMWF'
    });
  } catch (error) {
    console.warn('Fallback weather triggered:', error);
    // Reliable fallback typical for Sunda Strait / Indonesian monsoon
    return NextResponse.json({
      time: new Date().toISOString(),
      surfaceWindSpeedKmh: 18.5,
      surfaceWindDirectionDeg: 195, // Wind from South-Southwest blowing towards Northeast
      altitude850WindSpeedKmh: 24.2,
      altitude850WindDirectionDeg: 205,
      temperatureC: 28.5,
      humidityPercent: 78,
      source: 'Default Regional Met Simulation (Fallback)'
    });
  }
}
