import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
  Param
} from '@nestjs/common';
import { VolunteerService } from './volunteer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateVolunteerProfileDto } from './dto/update-volunteer-profile.dto';

@Controller('volunteers')
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) { }

  // Get own profile (for edit page)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getOwnProfile(@Request() req: any) {
    return this.volunteerService.getProfile(req.user.id);
  }
  
  // Update own profile
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: any,
    @Body() dto: UpdateVolunteerProfileDto
  ) {
    return this.volunteerService.updateProfile(req.user.id, dto);
  }

  // Public profile
  @Get(':id/profile')
  async getPublicProfile(@Param('id') id: string) {
    return this.volunteerService.getPublicProfile(id);
  }

  // Public journey
  @Get(':id/journey')
  async getJourney(@Param('id') id: string) {
    return this.volunteerService.getJourney(id);
  }
}