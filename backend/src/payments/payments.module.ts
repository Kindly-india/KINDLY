import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RazorpayService } from './razorpay.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, RazorpayService, JwtAuthGuard, AdminGuard],
  exports: [PaymentsService],
})
export class PaymentsModule {}
