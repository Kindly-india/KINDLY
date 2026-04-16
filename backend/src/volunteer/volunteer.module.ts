import { Module } from '@nestjs/common';
import { VolunteerController } from './volunteer.controller';
import { VolunteerService } from './volunteer.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { CertificateModule } from '../certificate/certificate.module';

@Module({
  imports: [SupabaseModule, CertificateModule],
  controllers: [VolunteerController],
  providers: [VolunteerService],
  exports: [VolunteerService],
})
export class VolunteerModule {}