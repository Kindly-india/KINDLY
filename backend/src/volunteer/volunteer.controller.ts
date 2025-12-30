import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { VolunteerService } from './volunteer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@Controller('volunteer')
export class VolunteerController {
  // THIS CONSTRUCTOR WAS MISSING
  constructor(private readonly volunteerService: VolunteerService) {}

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Request() req: any) {
    return this.volunteerService.getVolunteerHistory(req.user.id);
  }
}