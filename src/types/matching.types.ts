export interface QuoteDto {
  distanceKm: number;
  estimatedMinutes: number;
  pricing: string;
  surgeMultiplier: number;
  discountMultiplier: number;
  taxRate: number;
  total: number;
  currency: string;
}

export interface GetQuoteRequest {
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  promoCode?: string;
}

export interface NearbyDriverDto {
  driverId: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export interface DriverLocationDto {
  driverId: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  updatedAt: string;
}

export interface UpdateDriverLocationRequest {
  lat: number;
  lng: number;
  isAvailable: boolean;
}
