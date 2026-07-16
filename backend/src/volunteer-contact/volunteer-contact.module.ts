import { Module } from '@nestjs/common';
import { VolunteerContactController } from './volunteer-contact.controller';
import { VolunteerContactService } from './volunteer-contact.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [VolunteerContactController],
  providers: [VolunteerContactService],
})
export class VolunteerContactModule {}
