import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CertificateModule } from '../certificate/certificate.module';
import { EmailModule } from '../email/email.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [CertificateModule, EmailModule, PaymentsModule],
  controllers: [EventController],
  providers: [EventService, JwtAuthGuard, AdminGuard],
})
export class EventModule {}