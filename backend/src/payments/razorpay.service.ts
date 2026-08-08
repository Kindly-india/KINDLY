import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Thin wrapper over Razorpay's REST API using raw fetch (matches the
// existing outbound-HTTP convention in this codebase — see event.service.ts's
// Nominatim/Ola Maps calls — rather than adding the official `razorpay` SDK
// as a new dependency).

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface RazorpayRefund {
  id: string;
  status: string;
  amount: number;
}

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly baseUrl = 'https://api.razorpay.com/v1';
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor(private config: ConfigService) {
    this.keyId = this.config.getOrThrow<string>('RAZORPAY_KEY_ID');
    this.keySecret = this.config.getOrThrow<string>('RAZORPAY_KEY_SECRET');
  }

  private authHeader(): string {
    return (
      'Basic ' +
      Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')
    );
  }

  async createOrder(
    amountPaise: number,
    receipt: string,
  ): Promise<RazorpayOrder> {
    const res = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.authHeader(),
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt,
        payment_capture: 1,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(
        `Razorpay order creation failed: ${res.status} ${body}`,
      );
      throw new Error('Failed to create payment order');
    }

    return res.json() as Promise<RazorpayOrder>;
  }

  async refundPayment(
    razorpayPaymentId: string,
    amountPaise: number,
  ): Promise<RazorpayRefund> {
    const res = await fetch(
      `${this.baseUrl}/payments/${razorpayPaymentId}/refund`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authHeader(),
        },
        body: JSON.stringify({ amount: amountPaise }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(
        `Razorpay refund failed for ${razorpayPaymentId}: ${res.status} ${body}`,
      );
      throw new Error('Failed to process refund');
    }

    return res.json() as Promise<RazorpayRefund>;
  }
}
