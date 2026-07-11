import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Request,
  Req,
  Headers,
  UseGuards,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { MarkBillPaidDto } from './dto/mark-bill-paid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('events/:id/payment/order')
  @UseGuards(JwtAuthGuard)
  async createOrder(@Request() req: any, @Param('id') eventId: string) {
    return this.paymentsService.createOrder(req.user.id, eventId);
  }

  @Post('events/:id/payment/verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(
    @Request() req: any,
    @Param('id') eventId: string,
    @Body(ValidationPipe) dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(req.user.id, eventId, dto);
  }

  // No auth guard — Razorpay calls this directly. Authenticity is verified
  // via the x-razorpay-signature header inside the service, against the raw
  // request body (see main.ts's `rawBody: true`), not via a session token.
  @Post('payments/webhook')
  async webhook(@Req() req: any, @Headers('x-razorpay-signature') signature?: string) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body for webhook signature verification');
    }
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }

  @Get('events/:id/bill')
  @UseGuards(JwtAuthGuard)
  async getBill(@Request() req: any, @Param('id') eventId: string) {
    return this.paymentsService.getBill(req.user.id, eventId);
  }

  @Get('payments/admin/dashboard')
  @UseGuards(AdminGuard)
  async getAdminDashboard() {
    return this.paymentsService.getAdminDashboard();
  }

  @Patch('payments/admin/events/:id/bill/mark-paid')
  @UseGuards(AdminGuard)
  async markEventBillPaid(@Param('id') eventId: string, @Body(ValidationPipe) dto: MarkBillPaidDto) {
    return this.paymentsService.markEventBillPaid(eventId, dto.paidReference);
  }
}
