import { apiClient } from "../client";
import type {
  QuoteDto,
  GetQuoteRequest,
  NearbyDriverDto,
  DriverLocationDto,
  UpdateDriverLocationCommand,
} from "@/types/backend";

export const matchingAdapter = {
  getQuote: async (req: GetQuoteRequest): Promise<QuoteDto> => {
    return apiClient<QuoteDto>("/quote", {
      method: "POST",
      body: JSON.stringify(req),
    });
  },

  matchDrivers: async (lat: number, lng: number): Promise<NearbyDriverDto[]> => {
    return apiClient<NearbyDriverDto[]>("/match", {
      method: "POST",
      body: JSON.stringify({ lat, lng }),
    });
  },

  updateLocation: async (cmd: UpdateDriverLocationCommand): Promise<DriverLocationDto> => {
    return apiClient<DriverLocationDto>("/drivers/me/location", {
      method: "PUT",
      body: JSON.stringify(cmd),
    });
  },
};
