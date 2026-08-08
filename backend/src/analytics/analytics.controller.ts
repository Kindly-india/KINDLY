import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('volunteer')
  @UseGuards(JwtAuthGuard)
  async getVolunteerReport(@Request() req) {
    return this.analyticsService.getVolunteerImpact(req.user.id);
  }

  @Get('org')
  @UseGuards(JwtAuthGuard)
  async getOrgReport(@Request() req) {
    return this.analyticsService.getOrgAnalytics(req.user.id);
  }

  @Get('platform')
  async getPlatformStats() {
    return this.analyticsService.getPlatformStats();
  }
}
