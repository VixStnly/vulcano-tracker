export type VolcanoStatusLevel = 1 | 2 | 3 | 4;

export type VolcanoStatusText = 'NORMAL' | 'WASPADA' | 'SIAGA' | 'AWAS';

export interface VolcanoData {
  id: string;
  name: string;
  regionalLocation: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  craterName: string;
  statusLevel: VolcanoStatusLevel;
  statusText: VolcanoStatusText;
  krbRadiusKm: number;
  columnHeightMeters: number;
  lastEruptionDate: string;
  vonaColorCode: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  aviationSummary: string;
  description: string;
  monitoringPost: string;
  defaultCity?: { name: string; lat: number; lon: number };
}

export interface WindAtmosphereData {
  time: string;
  surfaceWindSpeedKmh: number;
  surfaceWindDirectionDeg: number;
  altitude850WindSpeedKmh: number;
  altitude850WindDirectionDeg: number;
  temperatureC: number;
  humidityPercent: number;
}

export interface AirQualityData {
  time: string;
  so2: number; // Sulphur Dioxide (ug/m3)
  pm25: number; // PM2.5 (ug/m3)
  pm10: number; // PM10 (ug/m3)
  dust: number; // Dust particles (ug/m3)
  europeanAqi: number; // European Air Quality Index
}

export interface VaacLayer {
  direction?: string | null;
  fl_label: string;
  speed_kt?: number | null;
  points: [number, number][];
}

export interface VaacAdvisoryData {
  volcano: string;
  dtg: string;
  obs_dtg: string;
  next_advisory: string;
  status: string;
  eruption_details: string;
  obs_layers: VaacLayer[];
  fcst_6h_layers?: VaacLayer[];
  fcst_12h_layers?: VaacLayer[];
  fcst_18h_layers?: VaacLayer[];
  source: string;
}

export type ImpactSeverity = 'KRB_EXTREME' | 'SEVERE' | 'MODERATE' | 'LIGHT_ALERT' | 'SAFE';

export interface ImpactAssessment {
  targetName: string;
  targetLat: number;
  targetLon: number;
  distanceKm: number;
  bearingDeg: number;
  bearingCardinal: string;
  
  // Plume analysis
  windTowardsDeg: number;
  windTowardsCardinal: string;
  dispersionConeAngle: number;
  angularOffsetDeg: number;
  isInPlumeCone: boolean;
  maxPlumeReachKm: number;
  
  // Official VAAC Darwin Advisory Integration
  isInsideVaacPolygon: boolean;
  vaacHitLayerLabel?: string;
  vaacEruptionDetails?: string;

  // Severity Verdict
  severity: ImpactSeverity;
  severityLabel: string;
  severityColor: string;
  summaryReason: string;
  healthAdvice: string[];
  aviationNotice: string;
}

export interface GeocodedLocation {
  id: string;
  displayName: string;
  shortName: string;
  latitude: number;
  longitude: number;
  type: string;
}
