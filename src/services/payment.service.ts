import { apiClient } from "@/lib/api-client";
import type { PaymentDto, CreatePaymentRequest } from "@/types";

export const paymentService = {
  createPayment: (req: CreatePaymentRequest): Promise<PaymentDto> => {
    const idempotencyKey = req.idempotencyKey || crypto.randomUUID();
    return apiClient.post<PaymentDto>(
      "/payments",
      {
        tripId: req.tripId,
        paymentToken: req.paymentToken,
      },
      {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      }
    );
  },

  getPayment: (id: string): Promise<PaymentDto> => {
    return apiClient.get<PaymentDto>(`/payments/${id}`);
  },
};
