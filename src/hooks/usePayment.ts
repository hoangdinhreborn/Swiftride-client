"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentService } from "@/services/payment.service";
import type { CreatePaymentRequest, PaymentDto } from "@/types";

export function usePayment(tripId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: CreatePaymentRequest) => paymentService.createPayment(req),
    onSuccess: (payment: PaymentDto) => {
      if (tripId) {
        queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      }
      queryClient.setQueryData(["payment", payment.id], payment);
    },
  });
}
