export type CrowdLevel = "low" | "medium" | "high";
export type PriceLevel = "low" | "medium" | "high";

export interface CityRecord {
  id: string;
  name: string;
  slug: string;
  country: string;
  latitude: number;
  longitude: number;
  population: number;
}

export interface MonthlyScoreRecord {
  cityId: string;
  cityName: string;
  country: string;
  citySlug: string;
  month: string;
  score: number;
  crowdLevel: CrowdLevel;
  priceLevel: PriceLevel;
}

export interface PointOfInterest {
  id: string;
  cityId: string;
  name: string;
  category: string;
  indoor: boolean;
  popularityScore: number;
  lat: number;
  lon: number;
  image?: PoiImage;
}

export interface PoiImage {
  source: string;
  sourcePageUrl: string;
  fileTitle: string;
  imageUrl: string;
  thumbUrl?: string | null;
  width?: number | null;
  height?: number | null;
  author?: string | null;
  licenseName?: string | null;
  licenseUrl?: string | null;
  attributionText?: string | null;
}

export interface InternalLink {
  slug: string;
  label: string;
  score: number;
}

export interface PagePayload {
  slug: string;
  cityId: string;
  cityName: string;
  citySlug: string;
  country: string;
  month: string;
  summary: string;
  generatedAt: string;
  score: number;
  scoreLabel: string;
  climate: {
    avgTempDay: number;
    avgTempNight: number;
    rainfallMm: number;
    rainyDays: number;
    humidity: number;
    sunshineHours: number;
  };
  verdict: {
    heading: string;
    pros: string[];
    cons: string[];
  };
  attractions: {
    outdoor: PointOfInterest[];
    indoor: PointOfInterest[];
  };
  recommendations: string[];
  tips: string[];
  travelSignals: {
    crowdLevel: CrowdLevel;
    priceLevel: PriceLevel;
  };
  internalLinks: {
    sameCity: InternalLink[];
    similarCities: InternalLink[];
  };
  editorial?: {
    bestFor?: string[];
    monthRead?: string;
    bookingRead?: string;
  };
  copyMeta?: {
    source: "rules" | "openai";
    model?: string;
    promptVersion?: string;
    locale?: string;
    generatedAt: string;
  };
}
