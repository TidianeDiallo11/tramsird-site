import type { PaymentMethod, PaymentStatus } from "@/generated/prisma/enums";

export type ChargeRequest = {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  method: PaymentMethod;
  customerPhone?: string | null;
};

export type ChargeResult = {
  status: PaymentStatus;
  providerReference?: string;
  message: string;
  redirectUrl?: string;
  raw?: unknown;
};

export interface PaymentProvider {
  readonly key: string;
  isConfigured(): boolean;
  initiate(request: ChargeRequest): Promise<ChargeResult>;
}
