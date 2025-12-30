import { Module } from '@nestjs/common';
import { VolunteerController } from './volunteer.controller';
import { VolunteerService } from './volunteer.service';
import { SupabaseModule } from '../supabase/supabase.module'; // Ensure this path is correct for your project

@Module({
  imports: [SupabaseModule], // Import Supabase so the Service can use it
  controllers: [VolunteerController],
  providers: [VolunteerService],
  exports: [VolunteerService],
})
export class VolunteerModule {}