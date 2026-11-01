"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tripService } from "@/services/trip.service";
import type { TripDto } from "@/types";

export function useTripActions(tripId: string) {
  const queryClient = useQueryClient();

  const invalidate = (updated: TripDto) => {
    queryClient.setQueryData(["trip", tripId], updated);
    queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
  };

  const accept = useMutation({
    mutationFn: () => tripService.acceptTrip(tripId),
    onSuccess: invalidate,
  });

  const pickup = useMutation({
    mutationFn: () => tripService.pickupTrip(tripId),
    onSuccess: invalidate,
  });

  const dropoff = useMutation({
    mutationFn: () => tripService.dropoffTrip(tripId),
    onSuccess: invalidate,
  });

  return {
    accept,
    pickup,
    dropoff,
    isProcessing: accept.isPending || pickup.isPending || dropoff.isPending,
  };
}
