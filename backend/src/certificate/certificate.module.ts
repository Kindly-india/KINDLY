import { Module } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { CertificateController } from './certificate.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  controllers: [CertificateController],
  providers: [CertificateService, JwtAuthGuard],
  exports: [CertificateService],
})
export class CertificateModule {}
