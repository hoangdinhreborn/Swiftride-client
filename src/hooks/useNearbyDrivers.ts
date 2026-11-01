"use client";

import { useQuery } from "@tanstack/react-query";
import { matchingService } from "@/services/matching.service";

export function useNearbyDrivers(lat?: number, lng?: number) {
  const isEnabled = typeof lat === "number" && typeof lng === "number";

  return useQuery({
    queryKey: ["nearbyDrivers", lat, lng],
    queryFn: () => (isEnabled ? matchingService.matchDrivers(lat, lng) : []),
    enabled: isEnabled,
    refetchInterval: 6000,
    staleTime: 5000,
  });
}
