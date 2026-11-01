"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tripService } from "@/services/trip.service";
import type { TripDto } from "@/types";

export function useTripActions(tripId: string) {
  const queryClient = useQueryClient();

  const invalidate = (updated: TripDto) => {
    queryClient.setQueryData(["trip", tripId], updated);
    queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    queryClient.invalidateQueries({ queryKey: ["myOffers"] });
  };

  const confirm = useMutation({
    mutationFn: () => tripService.confirmTrip(tripId),
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: () => tripService.cancelTrip(tripId),
    onSuccess: invalidate,
  });

  const accept = useMutation({
    mutationFn: () => tripService.acceptTrip(tripId),
    onSuccess: invalidate,
  });

  const decline = useMutation({
    mutationFn: () => tripService.declineTrip(tripId),
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
    confirm,
    cancel,
    accept,
    decline,
    pickup,
    dropoff,
    isProcessing:
      confirm.isPending ||
      cancel.isPending ||
      accept.isPending ||
      decline.isPending ||
      pickup.isPending ||
      dropoff.isPending,
  };
}
