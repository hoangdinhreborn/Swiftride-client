export type TripStatus =
  | "Requested"
  | "Searching"
  | "DriverOffered"
  | "DriverAccepted"
  | "EnRoute"
  | "PickedUp"
  | "DroppedOff"
  | "PaymentPending"
  | "Paid"
  | "Cancelled"
  | "Failed";

export interface TripDto {
  id: string;
  riderId: string;
  driverId: string | null;
  offeredDriverId?: string | null;
  pickup: string;
  pickupLat: number;
  pickupLng: number;
  destination: string;
  destinationLat: number;
  destinationLng: number;
  quotedFare: number;
  status: TripStatus;
  createdAt: string;
  declineCount?: number;
}

export interface RequestTripRequest {
  pickup: string;
  pickupLat: number;
  pickupLng: number;
  destination: string;
  destinationLat: number;
  destinationLng: number;
  promoCode?: string;
}

export interface AggregateTripDto {
  trip: TripDto;
  payment: unknown | null;
  paymentState: "found" | "none" | "hidden" | "unavailable";
}
