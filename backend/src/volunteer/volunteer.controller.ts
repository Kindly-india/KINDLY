import { Controller, Get, Post, Body, UseGuards, Request, Patch } from '@nestjs/common';
import { VolunteerService } from './volunteer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('volunteer')
@UseGuards(JwtAuthGuard)
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) {}

  // This fixes "Welcome Volunteer" -> "Welcome Manas"
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.volunteerService.getProfile(req.user.id);
  }

  @Post('profile')
  async createProfile(@Request() req: any, @Body() dto: any) {
    return this.volunteerService.createProfile(req.user.id, dto);
  }

  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() dto: any) {
    return this.volunteerService.updateProfile(req.user.id, dto);
  }

  // Your old history endpoint (if you still want it)
  @Get('history')
  async getHistory(@Request() req: any) {
    return this.volunteerService.getVolunteerHistory(req.user.id);
  }
}