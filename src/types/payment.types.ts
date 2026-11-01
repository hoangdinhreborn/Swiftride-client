export type PaymentStatus = "Pending" | "Succeeded" | "Failed" | "Refunded";

export interface PaymentDto {
  id: string;
  tripId: string;
  payerId: string;
  amount: number;
  status: PaymentStatus;
  idempotencyKey?: string;
  createdAt: string;
}

export interface CreatePaymentRequest {
  tripId: string;
  paymentToken: string;
  idempotencyKey?: string;
}
