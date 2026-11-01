import { apiClient } from "../client";
import type { TripDto, RequestTripCommand } from "@/types/backend";

export const tripAdapter = {
  requestTrip: async (cmd: RequestTripCommand): Promise<TripDto> => {
    return apiClient<TripDto>("/trips", {
      method: "POST",
      body: JSON.stringify(cmd),
    });
  },

  getTrip: async (id: string): Promise<TripDto> => {
    return apiClient<TripDto>(`/trips/${id}`, {
      method: "GET",
    });
  },

  acceptTrip: async (id: string): Promise<TripDto> => {
    return apiClient<TripDto>(`/trips/${id}/driver-accept`, {
      method: "POST",
    });
  },

  pickupTrip: async (id: string): Promise<TripDto> => {
    return apiClient<TripDto>(`/trips/${id}/pickup`, {
      method: "POST",
    });
  },

  dropoffTrip: async (id: string): Promise<TripDto> => {
    return apiClient<TripDto>(`/trips/${id}/dropoff`, {
      method: "POST",
    });
  },
};
