import { apiClient } from "@/lib/api-client";
import type {
  QuoteDto,
  GetQuoteRequest,
  NearbyDriverDto,
  DriverLocationDto,
  UpdateDriverLocationRequest,
} from "@/types";

export const matchingService = {
  getQuote: (req: GetQuoteRequest): Promise<QuoteDto> => {
    return apiClient.post<QuoteDto>("/quote", req);
  },

  matchDrivers: (lat: number, lng: number): Promise<NearbyDriverDto[]> => {
    return apiClient.post<NearbyDriverDto[]>("/match", { lat, lng });
  },

  updateLocation: (req: UpdateDriverLocationRequest): Promise<DriverLocationDto> => {
    return apiClient.put<DriverLocationDto>("/drivers/me/location", req);
  },

  getDriverLocation: (driverId: string): Promise<DriverLocationDto> => {
    return apiClient.get<DriverLocationDto>(`/drivers/${driverId}/location`);
  },
};
