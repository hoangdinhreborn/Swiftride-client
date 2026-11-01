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

export interface RequestTripRequest {
  pickup: string;
  pickupLat: number;
  pickupLng: number;
  destination: string;
  destinationLat: number;
  destinationLng: number;
  promoCode?: string;
}
