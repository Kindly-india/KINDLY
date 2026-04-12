import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { VolunteerModule } from './volunteer/volunteer.module';
import { OrganizationModule } from './organization/organization.module';
import { EventModule } from './event/event.module'; // Add this
import { SocialModule } from './social/social.module';
import { AnalyticsModule } from './analytics/analytics.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    AuthModule,
    VolunteerModule,
    SocialModule,
    OrganizationModule,
    EventModule,
    AnalyticsModule,
  ],
})
export class AppModule {}