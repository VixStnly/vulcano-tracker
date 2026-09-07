import { ImpactAssessment, ImpactSeverity, VolcanoData, VaacAdvisoryData } from './types';

// Convert degrees to radians
export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Convert radians to degrees
export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

// Ray-casting algorithm to test if a point [lat, lon] is inside a polygon [[lat, lon], ...]
export function isPointInPolygon(point: [number, number], vs: [number, number][]): boolean {
  const y = point[0]; // latitude
  const x = point[1]; // longitude
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const yi = vs[i][0], xi = vs[i][1];
    const yj = vs[j][0], xj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Haversine formula to compute great-circle distance between two points in km
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Initial bearing from point 1 to point 2 (0° - 360°)
export function calculateBearingDeg(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const brng = toDeg(Math.atan2(y, x));
  return Math.round((brng + 360) % 360);
}

// Convert bearing in degrees to Indonesian cardinal direction
export function degToIndonesianCardinal(deg: number): string {
  const val = Math.floor((deg / 22.5) + 0.5) % 16;
  const directions = [
    'Utara (U)',
    'Utara-Timur Laut (UTL)',
    'Timur Laut (TL)',
    'Timur-Timur Laut (TTL)',
    'Timur (T)',
    'Timur-Tenggara (TTG)',
    'Tenggara (TG)',
    'Selatan-Tenggara (STG)',
    'Selatan (S)',
    'Selatan-Barat Daya (SBD)',
    'Barat Daya (BD)',
    'Barat-Barat Daya (BBD)',
    'Barat (B)',
    'Barat-Barat Laut (BBL)',
    'Barat Laut (BL)',
    'Utara-Barat Laut (UBL)'
  ];
  return directions[val];
}

// Destination point given distance (km) and bearing (deg) from origin
export function calculateDestinationPoint(
  lat: number,
  lon: number,
  distanceKm: number,
  bearingDeg: number
): [number, number] {
  const R = 6371;
  const d = distanceKm / R;
  const brng = toRad(bearingDeg);
  const lat1 = toRad(lat);
  const lon1 = toRad(lon);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [toDeg(lat2), toDeg(lon2)];
}

// Generate the polygon coordinates for the volcanic ash plume dispersion cone
export function generatePlumePolygon(
  volcanoLat: number,
  volcanoLon: number,
  windDirectionDeg: number,
  windSpeedKmh: number,
  columnHeightMeters: number
): [number, number][] {
  const windTowardsDeg = (windDirectionDeg + 180) % 360;
  
  const maxReachKm = Math.min(
    320,
    Math.max(80, windSpeedKmh * 4.5 + columnHeightMeters / 15)
  );

  const halfConeAngle = 28;
  const points: [number, number][] = [];

  points.push([volcanoLat, volcanoLon]);

  const numArcSteps = 16;
  const startAngle = windTowardsDeg - halfConeAngle;
  const endAngle = windTowardsDeg + halfConeAngle;

  for (let i = 0; i <= numArcSteps; i++) {
    const angle = startAngle + ((endAngle - startAngle) * i) / numArcSteps;
    const centerFactor = 1 - 0.25 * Math.pow((2 * i) / numArcSteps - 1, 2);
    const stepReach = maxReachKm * centerFactor;
    const dest = calculateDestinationPoint(volcanoLat, volcanoLon, stepReach, angle);
    points.push(dest);
  }

  points.push([volcanoLat, volcanoLon]);

  return points;
}

// Assess impact on a target city based on official VAAC Darwin advisory and wind data
export function assessLocationImpact(
  volcano: VolcanoData,
  targetLat: number,
  targetLon: number,
  targetName: string,
  windDirectionDeg: number,
  windSpeedKmh: number,
  vaacData?: VaacAdvisoryData | null
): ImpactAssessment {
  const distanceKm = calculateDistanceKm(volcano.latitude, volcano.longitude, targetLat, targetLon);
  const bearingDeg = calculateBearingDeg(volcano.latitude, volcano.longitude, targetLat, targetLon);
  const bearingCardinal = degToIndonesianCardinal(bearingDeg);

  // Wind blows towards
  const windTowardsDeg = (windDirectionDeg + 180) % 360;
  const windTowardsCardinal = degToIndonesianCardinal(windTowardsDeg);

  let angularOffset = Math.abs(bearingDeg - windTowardsDeg);
  if (angularOffset > 180) {
    angularOffset = 360 - angularOffset;
  }

  const dispersionConeAngle = 28;
  const maxPlumeReachKm = Math.min(
    320,
    Math.max(80, windSpeedKmh * 4.5 + volcano.columnHeightMeters / 15)
  );

  const isInPlumeCone = angularOffset <= dispersionConeAngle && distanceKm <= maxPlumeReachKm;

  // 1. Check Official VAAC Darwin Advisory Polygon
  let isInsideVaacPolygon = false;
  let vaacHitLayerLabel = '';
  let isInsideForecast6h = false;

  if (vaacData && vaacData.obs_layers && vaacData.obs_layers.length > 0) {
    for (const layer of vaacData.obs_layers) {
      if (layer.points && layer.points.length >= 3) {
        if (isPointInPolygon([targetLat, targetLon], layer.points)) {
          isInsideVaacPolygon = true;
          vaacHitLayerLabel = layer.fl_label;
          break;
        }
      }
    }

    if (!isInsideVaacPolygon && vaacData.fcst_6h_layers) {
      for (const layer of vaacData.fcst_6h_layers) {
        if (layer.points && layer.points.length >= 3) {
          if (isPointInPolygon([targetLat, targetLon], layer.points)) {
            isInsideForecast6h = true;
            vaacHitLayerLabel = `${layer.fl_label} (+6 jam)`;
            break;
          }
        }
      }
    }
  }

  let severity: ImpactSeverity = 'SAFE';
  let severityLabel = 'AMAN / TIDAK TERDAMPAK';
  let severityColor = '#22c55e'; // Green
  let summaryReason = '';
  const healthAdvice: string[] = [];
  let aviationNotice = 'Kondisi ruang udara lokal dalam batas toleransi normal. Jalur penerbangan tidak terhalang sebaran abu utama.';

  // 1. Check Primary KRB
  if (distanceKm <= volcano.krbRadiusKm) {
    severity = 'KRB_EXTREME';
    severityLabel = 'ZONA KRB / BAHAYA EKSTREM (EVAKUASI)';
    severityColor = '#ef4444'; // Bright Red
    summaryReason = `Lokasi berada dalam radius Kawasan Rawan Bencana (KRB ${volcano.krbRadiusKm} km) dari kawah aktif ${volcano.name}. Terancam langsung oleh lontaran material pijar, awan panas, dan aliran lava.`;
    healthAdvice.push('EVAKUASI MUTLAK: Tinggalkan area sesuai arahan BPBD dan PVMBG.');
    healthAdvice.push('Gunakan kacamata pelindung tertutup (goggles) dan masker respirator N95/FFP2.');
    healthAdvice.push('Waspadai potensi banjir lahar hujan di lembah aliran sungai.');
    aviationNotice = 'ZONA MERAH: Larangan terbang mutlak di atas ruang udara kawah aktif (ASHTAM/NOTAM issued).';
  } else if (isInsideVaacPolygon) {
    // Verified inside Official VAAC Darwin Advisory Polygon
    severity = distanceKm <= 50 ? 'SEVERE' : 'MODERATE';
    severityLabel = distanceKm <= 50
      ? 'TERDAMPAK PARAH / HUJAN ABU LEBAT (VAAC DARWIN)'
      : 'TERDAMPAK SEBARAN ABU (ADVISORY RESMI VAAC DARWIN)';
    severityColor = distanceKm <= 50 ? '#ef4444' : '#ea580c';
    summaryReason = `Lokasi ${targetName} TERKONFIRMASI TERDAMPAK LANGSUNG: Berada di dalam batas poligon resmi VAAC Darwin (Volcanic Ash Advisory Centre - Bureau of Meteorology Australia) pada lapisan ${vaacHitLayerLabel}. Abu membubung tinggi hingga ketinggian 4.6 - 15 km dpl dan melintasi Selat Sunda menutupi wilayah Jawa Barat dan sekitarnya.`;
    healthAdvice.push('Tutup pintu, jendela, dan ventilasi udara rapat-rapat.');
    healthAdvice.push('Wajib memakai masker N95 atau masker medis rangkap saat beraktivitas di luar.');
    healthAdvice.push('Gunakan kacamata pelindung untuk menghindari iritasi partikel silika tajam.');
    healthAdvice.push('Tutup rapat wadah penampungan air minum dan sumber pangan keluarga.');
    aviationNotice = `WARNING VAAC DARWIN: Ruang udara tercemar partikel abu vulkanik ${vaacHitLayerLabel}. Maskapai disarankan mematuhi jalur deviasi SIGMET.`;
  } else if (isInsideForecast6h) {
    severity = 'MODERATE';
    severityLabel = 'WASPADA: PREDIKSI TERDAMPAK DALAM +6 JAM';
    severityColor = '#f59e0b';
    summaryReason = `Lokasi ${targetName} diprediksi masuk ke dalam zona sebaran abu vulkanik ${volcano.name} dalam rentang 6 jam ke depan berdasarkan model trajektori VAAC Darwin.`;
    healthAdvice.push('Siapkan masker pelindung dan batasi rencana aktivitas luar ruangan.');
    healthAdvice.push('Pantau pembaruan buletin VAAC Darwin & PVMBG berikutnya.');
    aviationNotice = 'FORECAST ADVISORY: Trajektori abu bergerak menuju koordinat ini dalam 6-12 jam.';
  } else if (isInPlumeCone) {
    if (distanceKm <= 40) {
      severity = 'SEVERE';
      severityLabel = 'TERDAMPAK PARAH / HUJAN ABU TEBAL';
      severityColor = '#ea580c';
      summaryReason = `Lokasi berada langsung di bawah trajektori kerucut abu ${volcano.name} sejauh ${distanceKm} km (angin berhembus ke arah ${windTowardsCardinal}). Diprediksi terjadi hujan abu vulkanik lebat.`;
      healthAdvice.push('Tutup seluruh pintu dan jendela; batasi aktivitas di luar ruangan.');
      healthAdvice.push('Wajib gunakan masker N95 untuk mencegah ISPA.');
      healthAdvice.push('Tutup rapat tempat penampungan air minum.');
      aviationNotice = 'SEVERELY IMPACTED: Ruang udara tercemar abu vulkanik konsentrasi tinggi.';
    } else if (distanceKm <= 120) {
      severity = 'MODERATE';
      severityLabel = 'TERDAMPAK SEDANG / HUJAN ABU TERASA';
      severityColor = '#f59e0b';
      summaryReason = `Lokasi berada di jalur sebaran abu sejauh ${distanceKm} km. Terpantau potensi hujan abu pasir halus di permukaan kendaraan dan vegetasi.`;
      healthAdvice.push('Gunakan masker pelindung hidung & mulut saat berpergian.');
      healthAdvice.push('Kenakan kacamata pelindung; hindari mengucek mata.');
      aviationNotice = 'MODERATE HAZARD: Maskapai penerbangan disarankan mengambil rute deviasi.';
    } else {
      severity = 'LIGHT_ALERT';
      severityLabel = 'WASPADA SEBARAN ABU TIPIS / GAS SO2';
      severityColor = '#eab308';
      summaryReason = `Lokasi berada di ujung kerucut dispersi ${volcano.name} sejauh ${distanceKm} km. Potensi hujan abu sangat tipis dan peningkatan gas sulfur dioksida (SO2).`;
      healthAdvice.push('Kelompok rentan (anak-anak, lansia, penderita asma) diimbau mengenakan masker.');
      healthAdvice.push('Pantau indeks kualitas udara (PM2.5 dan SO2) secara berkala.');
      aviationNotice = 'CAUTION: Lapisan kabut abu tipis (fine aerosol haze) terpantau di udara.';
    }
  } else {
    severity = 'SAFE';
    severityLabel = 'AMAN / TIDAK TERDAMPAK SEBARAN ABU';
    severityColor = '#22c55e';
    summaryReason = `Lokasi berada di luar radius Kawasan Rawan Bencana dan di luar poligon aktif sebaran abu ${volcano.name} sejauh ${distanceKm} km.`;
    healthAdvice.push('Kondisi lingkungan dan udara relatif aman dari abu vulkanik.');
    healthAdvice.push('Tetap pantau pembaruan berkala karena pola angin atmosfer dapat bergeser sewaktu-waktu.');
  }

  return {
    targetName,
    targetLat,
    targetLon,
    distanceKm,
    bearingDeg,
    bearingCardinal,
    windTowardsDeg,
    windTowardsCardinal,
    dispersionConeAngle,
    angularOffsetDeg: Math.round(angularOffset * 10) / 10,
    isInPlumeCone,
    maxPlumeReachKm: Math.round(maxPlumeReachKm),
    isInsideVaacPolygon,
    vaacHitLayerLabel,
    vaacEruptionDetails: vaacData?.eruption_details,
    severity,
    severityLabel,
    severityColor,
    summaryReason,
    healthAdvice,
    aviationNotice
  };
}
