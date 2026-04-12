// src/analytics/analytics.module.ts
import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, JwtAuthGuard],
})
export class AnalyticsModule {}