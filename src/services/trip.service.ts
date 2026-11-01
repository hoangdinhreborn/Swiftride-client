import { apiClient } from "@/lib/api-client";
import type { TripDto, RequestTripRequest } from "@/types";

export const tripService = {
  requestTrip: (cmd: RequestTripRequest): Promise<TripDto> => {
    return apiClient.post<TripDto>("/trips", cmd);
  },

  getTrip: (id: string): Promise<TripDto> => {
    return apiClient.get<TripDto>(`/trips/${id}`);
  },

  confirmTrip: (id: string): Promise<TripDto> => {
    return apiClient.post<TripDto>(`/trips/${id}/confirm`);
  },

  cancelTrip: (id: string): Promise<TripDto> => {
    return apiClient.post<TripDto>(`/trips/${id}/cancel`);
  },

  acceptTrip: (id: string): Promise<TripDto> => {
    return apiClient.post<TripDto>(`/trips/${id}/driver-accept`);
  },

  declineTrip: (id: string): Promise<TripDto> => {
    return apiClient.post<TripDto>(`/trips/${id}/driver-decline`);
  },

  pickupTrip: (id: string): Promise<TripDto> => {
    return apiClient.post<TripDto>(`/trips/${id}/pickup`);
  },

  dropoffTrip: (id: string): Promise<TripDto> => {
    return apiClient.post<TripDto>(`/trips/${id}/dropoff`);
  },

  getMyOffers: (): Promise<TripDto[]> => {
    return apiClient.get<TripDto[]>("/trips/offers");
  },
};
