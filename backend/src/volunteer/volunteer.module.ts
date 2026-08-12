import { Module } from '@nestjs/common';
import { VolunteerController } from './volunteer.controller';
import { VolunteerService } from './volunteer.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { CertificateModule } from '../certificate/certificate.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [SupabaseModule, CertificateModule, AuditModule],
  controllers: [VolunteerController],
  providers: [VolunteerService],
  exports: [VolunteerService],
})
export class VolunteerModule {}
