import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { RazorpayService } from './razorpay.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private supabaseService: SupabaseService,
    private razorpayService: RazorpayService,
    private config: ConfigService,
  ) {}

  // ─── Order creation ─────────────────────────────────────────────────────

  async createOrder(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: volProfile } = await supabase
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!volProfile) throw new NotFoundException('Volunteer profile not found');

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, ticket_price, registration_deadline, total_slots, registered_count, status')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event) throw new NotFoundException('Event not found');
    if (!event.ticket_price || event.ticket_price <= 0) {
      throw new BadRequestException('This event is not a paid event');
    }
    if (event.status !== 'published') {
      throw new BadRequestException('This event is not open for registration');
    }
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      throw new BadRequestException('Registration deadline has passed');
    }
    // UX-only pre-check to avoid generating orders for obviously-full events.
    // The real enforcement is confirm_paid_registration's atomic check at
    // confirm time — capacity can still change during checkout (UPI payments
    // can take minutes to settle).
    if (event.total_slots !== null && event.registered_count >= event.total_slots) {
      throw new BadRequestException('Event is already full');
    }

    const { data: existingReg } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('volunteer_id', volProfile.id)
      .maybeSingle();

    if (existingReg) throw new BadRequestException('Already registered for this event');

    // Reuse a pending order instead of minting a new one on double-click/retry.
    const { data: existingPayment } = await supabase
      .from('event_payments')
      .select('*')
      .eq('event_id', eventId)
      .eq('volunteer_id', volProfile.id)
      .eq('status', 'created')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPayment) {
      return {
        orderId: existingPayment.razorpay_order_id,
        amount: existingPayment.amount_paise,
        currency: 'INR',
      };
    }

    const order = await this.razorpayService.createOrder(event.ticket_price, crypto.randomUUID());

    const { error: insertError } = await supabase.from('event_payments').insert({
      event_id: eventId,
      volunteer_id: volProfile.id,
      razorpay_order_id: order.id,
      amount_paise: event.ticket_price,
      status: 'created',
    });

    if (insertError) throw insertError;

    return { orderId: order.id, amount: event.ticket_price, currency: 'INR' };
  }

  // ─── Payment confirmation (client verify + webhook backstop) ───────────

  async verifyPayment(userId: string, eventId: string, dto: VerifyPaymentDto) {
    const supabase = this.supabaseService.getClient();

    const { data: volProfile } = await supabase
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!volProfile) throw new NotFoundException('Volunteer profile not found');

    const { data: payment } = await supabase
      .from('event_payments')
      .select('*')
      .eq('razorpay_order_id', dto.razorpayOrderId)
      .eq('event_id', eventId)
      .eq('volunteer_id', volProfile.id)
      .maybeSingle();

    if (!payment) throw new NotFoundException('Payment order not found');

    if (!this.verifyOrderSignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature)) {
      throw new BadRequestException('Invalid payment signature');
    }

    return this.markPaidAndConfirm(payment, dto.razorpayPaymentId);
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined): Promise<{ received: boolean }> {
    const expected = crypto
      .createHmac('sha256', this.config.getOrThrow<string>('RAZORPAY_WEBHOOK_SECRET'))
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    const actualBuf = Buffer.from(signature ?? '', 'hex');

    if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    const entityId =
      payload?.payload?.payment?.entity?.id ?? payload?.payload?.refund?.entity?.id ?? 'unknown';
    const razorpayEventId = `${payload?.event}:${entityId}:${payload?.created_at ?? ''}`;

    const supabase = this.supabaseService.getClient();

    // Insert-before-process for at-least-once dedup — if this exact
    // delivery was already recorded, the unique constraint conflicts and we
    // no-op rather than reprocessing.
    const { error: insertError } = await supabase.from('payment_webhook_events').insert({
      razorpay_event_id: razorpayEventId,
      event_type: payload?.event,
      payload,
    });

    if (insertError) {
      return { received: true };
    }

    if (payload.event === 'payment.captured') {
      const entity = payload.payload?.payment?.entity;
      const orderId = entity?.order_id;
      const razorpayPaymentId = entity?.id;

      if (orderId && razorpayPaymentId) {
        const { data: payment } = await supabase
          .from('event_payments')
          .select('*')
          .eq('razorpay_order_id', orderId)
          .maybeSingle();

        if (payment && payment.status !== 'refunded' && payment.status !== 'failed') {
          await this.markPaidAndConfirm(payment, razorpayPaymentId).catch((err: any) => {
            this.logger.error(`Webhook confirm failed for order ${orderId}: ${err?.message}`);
          });
        }
      }
    } else if (payload.event === 'payment.failed') {
      const orderId = payload.payload?.payment?.entity?.order_id;
      if (orderId) {
        await supabase
          .from('event_payments')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('razorpay_order_id', orderId)
          .eq('status', 'created');
      }
    }

    return { received: true };
  }

  private verifyOrderSignature(orderId: string, paymentId: string, signature: string): boolean {
    const expected = crypto
      .createHmac('sha256', this.config.getOrThrow<string>('RAZORPAY_KEY_SECRET'))
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    let actualBuf: Buffer;
    try {
      actualBuf = Buffer.from(signature, 'hex');
    } catch {
      return false;
    }

    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  }

  // Shared by /verify and the webhook — both call this idempotently.
  private async markPaidAndConfirm(payment: any, razorpayPaymentId: string) {
    const supabase = this.supabaseService.getClient();

    if (payment.status === 'created') {
      await supabase
        .from('event_payments')
        .update({
          status: 'paid',
          razorpay_payment_id: razorpayPaymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)
        .eq('status', 'created'); // no-op if the other confirmation path already flipped it
    }

    try {
      const registration = await this.confirmRegistration(payment.event_id, payment.volunteer_id, payment.id);
      return { message: 'Payment confirmed, registration complete', registration };
    } catch (err: any) {
      const code = err?.message ?? '';
      if (code === 'EVENT_FULL' || code === 'DEADLINE_PASSED' || code === 'ALREADY_REGISTERED') {
        await this.autoRefundOrphanedPayment(payment, razorpayPaymentId);
        const reason =
          code === 'ALREADY_REGISTERED'
            ? "You're already registered for this event — this payment has been refunded."
            : 'The event became unavailable while your payment was processing — you have been refunded automatically.';
        throw new BadRequestException(reason);
      }
      throw err;
    }
  }

  private async confirmRegistration(eventId: string, volunteerId: string, paymentId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.rpc('confirm_paid_registration', {
      p_event_id: eventId,
      p_volunteer_id: volunteerId,
      p_payment_id: paymentId,
    });

    if (error) {
      const msg = error.message ?? '';
      if (msg.includes('EVENT_NOT_FOUND')) throw new NotFoundException('Event not found');
      if (msg.includes('DEADLINE_PASSED')) throw new Error('DEADLINE_PASSED');
      if (msg.includes('EVENT_FULL')) throw new Error('EVENT_FULL');
      if (msg.includes('ALREADY_REGISTERED')) throw new Error('ALREADY_REGISTERED');
      throw error;
    }

    return data;
  }

  private async autoRefundOrphanedPayment(payment: any, razorpayPaymentId: string) {
    const supabase = this.supabaseService.getClient();
    try {
      await this.razorpayService.refundPayment(razorpayPaymentId, payment.amount_paise);
      await supabase
        .from('event_payments')
        .update({
          status: 'refunded',
          refund_amount_paise: payment.amount_paise,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);
    } catch (refundErr: any) {
      // Leave status as 'paid' — this becomes visible on the admin
      // dashboard as an unrefunded payment with no matching registration,
      // needing manual attention.
      this.logger.error(`Auto-refund failed for orphaned payment ${payment.id}: ${refundErr?.message}`);
    }
  }

  // ─── Refunds (called from EventService's cancelRsvp / cancelEvent) ─────

  /**
   * Tiered refund for a volunteer-initiated cancellation. Throws if the
   * Razorpay refund call itself fails — callers must NOT delete the
   * registration row in that case, since the money hasn't actually moved.
   */
  async refundForVolunteerCancellation(paymentId: string, registrationDeadline: string | null) {
    const supabase = this.supabaseService.getClient();

    const { data: payment } = await supabase
      .from('event_payments')
      .select('*')
      .eq('id', paymentId)
      .maybeSingle();

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'paid') {
      return { refundPercent: 0, refundAmountPaise: 0 };
    }

    const hoursToDeadline = registrationDeadline
      ? (new Date(registrationDeadline).getTime() - Date.now()) / (1000 * 60 * 60)
      : 0;
    const refundPercent = hoursToDeadline > 24 ? 80 : 0;

    if (refundPercent === 0) {
      return { refundPercent: 0, refundAmountPaise: 0 };
    }

    const refundAmountPaise = Math.floor((payment.amount_paise * refundPercent) / 100);

    await this.razorpayService.refundPayment(payment.razorpay_payment_id, refundAmountPaise);

    await supabase
      .from('event_payments')
      .update({
        status: 'refunded',
        refund_amount_paise: refundAmountPaise,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    return { refundPercent, refundAmountPaise };
  }

  /**
   * Best-effort 100% refund for every paid registration when an org cancels
   * the whole event. Individual failures don't throw — those payments stay
   * 'paid' (unrefunded), which is exactly what surfaces them on the admin
   * dashboard's refund-attention list.
   */
  async refundForEventCancellation(eventId: string): Promise<{ failedCount: number }> {
    const supabase = this.supabaseService.getClient();

    const { data: payments } = await supabase
      .from('event_payments')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'paid');

    let failedCount = 0;

    for (const payment of payments ?? []) {
      try {
        await this.razorpayService.refundPayment(payment.razorpay_payment_id, payment.amount_paise);
        await supabase
          .from('event_payments')
          .update({
            status: 'refunded',
            refund_amount_paise: payment.amount_paise,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id);
      } catch (err: any) {
        failedCount++;
        this.logger.error(`Refund failed for payment ${payment.id} (event cancellation): ${err?.message}`);
      }
    }

    return { failedCount };
  }

  // ─── Bill / dashboard ────────────────────────────────────────────────────
  //
  // No stored-at-completion billing function: the bill is computed live from
  // event_payments every time it's viewed, and a row is only written to
  // event_bills at the moment admin marks it paid (freezing the amount then,
  // not at event-completion). This picks up any late-arriving payment
  // confirmation right up until the bill is actually paid, and avoids needing
  // a Postgres function shared between the pg_cron completion path and
  // completeEvent() — see FINANCE.md's Architecture section.

  private buildStoredBillView(row: any) {
    return {
      grossAmountPaise: row.gross_amount_paise,
      orgAmountPaise: row.org_amount_paise,
      platformFeePaise: row.platform_fee_paise,
      eligibleRegistrationCount: row.eligible_registration_count,
      status: 'paid' as const,
      paidAt: row.paid_at,
      paidReference: row.paid_reference,
    };
  }

  private buildLiveBillView(paidAmountsPaise: number[]) {
    if (paidAmountsPaise.length === 0) return null;
    const grossAmountPaise = paidAmountsPaise.reduce((sum, a) => sum + a, 0);
    const orgAmountPaise = Math.floor(grossAmountPaise * 0.92);
    return {
      grossAmountPaise,
      orgAmountPaise,
      platformFeePaise: grossAmountPaise - orgAmountPaise,
      eligibleRegistrationCount: paidAmountsPaise.length,
      status: 'pending' as const,
      paidAt: null,
      paidReference: null,
    };
  }

  private async getPaidAmounts(eventId: string): Promise<number[]> {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('event_payments')
      .select('amount_paise')
      .eq('event_id', eventId)
      .eq('status', 'paid');
    return (data ?? []).map((p: any) => p.amount_paise);
  }

  async getBill(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: event } = await supabase
      .from('events')
      .select('organization_id, status')
      .eq('id', eventId)
      .maybeSingle();

    if (!event) throw new NotFoundException('Event not found');

    const [{ data: orgProfile }, { data: volProfile }] = await Promise.all([
      supabase.from('organization_profiles').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('volunteer_profiles').select('is_admin').eq('user_id', userId).maybeSingle(),
    ]);

    const isOwner = orgProfile?.id === event.organization_id;
    const isAdmin = !!volProfile?.is_admin;

    if (!isOwner && !isAdmin) throw new ForbiddenException('Not authorized to view this bill');

    const { data: storedBill } = await supabase
      .from('event_bills')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();

    if (storedBill) return { bill: this.buildStoredBillView(storedBill) };
    if (event.status !== 'completed') return { bill: null };

    return { bill: this.buildLiveBillView(await this.getPaidAmounts(eventId)) };
  }

  async getAdminDashboard() {
    const supabase = this.supabaseService.getClient();

    const { data: paidEvents, error: paidEventsError } = await supabase
      .from('events')
      .select('id, title, status, organization_id, ticket_price, organization_profiles(name, upi_id)')
      .not('ticket_price', 'is', null)
      .gt('ticket_price', 0)
      .order('event_date', { ascending: false });

    if (paidEventsError) throw paidEventsError;

    const events = paidEvents ?? [];
    const eventIds = events.map((e: any) => e.id);
    const safeIds = eventIds.length ? eventIds : ['00000000-0000-0000-0000-000000000000'];

    const [{ data: payments }, { data: bills }] = await Promise.all([
      supabase.from('event_payments').select('event_id, status, amount_paise').in('event_id', safeIds),
      supabase.from('event_bills').select('*').in('event_id', safeIds),
    ]);

    const dashboard = events.map((event: any) => {
      const eventPayments = (payments ?? []).filter((p: any) => p.event_id === event.id);
      const paidPayments = eventPayments.filter((p: any) => p.status === 'paid');
      const storedBill = (bills ?? []).find((b: any) => b.event_id === event.id) ?? null;

      const bill = storedBill
        ? this.buildStoredBillView(storedBill)
        : event.status === 'completed'
          ? this.buildLiveBillView(paidPayments.map((p: any) => p.amount_paise))
          : null;

      return {
        eventId: event.id,
        title: event.title,
        status: event.status,
        organizationName: event.organization_profiles?.name,
        organizationUpiId: event.organization_profiles?.upi_id,
        paidRegistrationCount: paidPayments.length,
        grossCollectedPaise: paidPayments.reduce((sum: number, p: any) => sum + p.amount_paise, 0),
        bill,
        // Unrefunded paid payments on a cancelled event need manual follow-up
        // (refundForEventCancellation is best-effort and doesn't retry).
        needsRefundAttention: event.status === 'cancelled' ? paidPayments.length : 0,
      };
    });

    return { events: dashboard };
  }

  async markEventBillPaid(eventId: string, paidReference?: string) {
    const supabase = this.supabaseService.getClient();

    const { data: event } = await supabase
      .from('events')
      .select('organization_id, status')
      .eq('id', eventId)
      .maybeSingle();

    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== 'completed') {
      throw new BadRequestException('Event has not completed yet');
    }

    const { data: existing } = await supabase
      .from('event_bills')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing) {
      throw new BadRequestException('This bill has already been marked paid');
    }

    const amounts = await this.getPaidAmounts(eventId);
    const live = this.buildLiveBillView(amounts);
    if (!live) {
      throw new BadRequestException('No paid registrations to bill for this event');
    }

    const { data: bill, error } = await supabase
      .from('event_bills')
      .insert({
        event_id: eventId,
        organization_id: event.organization_id,
        gross_amount_paise: live.grossAmountPaise,
        org_amount_paise: live.orgAmountPaise,
        platform_fee_paise: live.platformFeePaise,
        eligible_registration_count: live.eligibleRegistrationCount,
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_reference: paidReference ?? null,
      })
      .select()
      .single();

    if (error) {
      // Unique-violation race: two concurrent mark-paid calls for the same event.
      if ((error as any).code === '23505') {
        throw new BadRequestException('This bill has already been marked paid');
      }
      throw error;
    }

    return { message: 'Bill marked as paid', bill: this.buildStoredBillView(bill) };
  }
}
