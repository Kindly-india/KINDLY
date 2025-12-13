import { Module } from '@nestjs/common';
import { VolunteerService } from './volunteer.service';

@Module({
  providers: [VolunteerService]
})
export class VolunteerModule {}
