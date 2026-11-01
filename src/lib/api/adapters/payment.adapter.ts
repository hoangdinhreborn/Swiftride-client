import { apiClient } from "../client";
import type { PaymentDto, CreatePaymentRequest } from "@/types/backend";

export const paymentAdapter = {
  createPayment: async (req: CreatePaymentRequest, idempotencyKey: string): Promise<PaymentDto> => {
    return apiClient<PaymentDto>("/payments", {
      method: "POST",
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(req),
    });
  },

  getPayment: async (id: string): Promise<PaymentDto> => {
    return apiClient<PaymentDto>(`/payments/${id}`, {
      method: "GET",
    });
  },

  refundPayment: async (id: string): Promise<PaymentDto> => {
    return apiClient<PaymentDto>(`/payments/${id}/refund`, {
      method: "POST",
    });
  },
};
