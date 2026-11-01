export type TripStatus =
  | "Requested"
  | "DriverAccepted"
  | "PickedUp"
  | "DroppedOff"
  | "Paid"
  | "Cancelled"
  | "Failed";

export interface TripDto {
  id: string;
  riderId: string;
  driverId: string | null;
  pickup: string;
  destination: string;
  quotedFare: number;
  status: TripStatus;
  createdAt: string;
}

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

export interface RequestTripCommand {
  pickup: string;
  pickupLat: number;
  pickupLng: number;
  destination: string;
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

export interface UpdateDriverLocationCommand {
  lat: number;
  lng: number;
  isAvailable: boolean;
}

export interface PaymentDto {
  id: string;
  tripId: string;
  payerId: string;
  amount: number;
  status: "Pending" | "Succeeded" | "Failed" | "Refunded";
  idempotencyKey?: string;
  createdAt: string;
}

export interface CreatePaymentRequest {
  tripId: string;
  paymentToken: string;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}
