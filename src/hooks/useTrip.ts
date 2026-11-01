"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tripService } from "@/services/trip.service";
import type { RequestTripRequest, TripDto } from "@/types";

export function useTrip(tripId: string) {
  return useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => (tripId ? tripService.getTrip(tripId) : null),
    enabled: !!tripId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "Paid" || status === "Cancelled" || status === "Failed") {
        return false;
      }
      return 3000;
    },
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cmd: RequestTripRequest) => tripService.requestTrip(cmd),
    onSuccess: (trip: TripDto) => {
      queryClient.setQueryData(["trip", trip.id], trip);
    },
  });
}
