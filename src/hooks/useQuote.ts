"use client";

import { useQuery } from "@tanstack/react-query";
import { matchingService } from "@/services/matching.service";
import type { GetQuoteRequest } from "@/types";

export function useQuote(req: GetQuoteRequest | null) {
  const isEnabled =
    !!req &&
    typeof req.pickupLat === "number" &&
    typeof req.pickupLng === "number" &&
    typeof req.destinationLat === "number" &&
    typeof req.destinationLng === "number";

  return useQuery({
    queryKey: [
      "quote",
      req?.pickupLat,
      req?.pickupLng,
      req?.destinationLat,
      req?.destinationLng,
      req?.promoCode,
    ],
    queryFn: () => (req ? matchingService.getQuote(req) : null),
    enabled: isEnabled,
    staleTime: 5000,
    retry: 1,
  });
}
