import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { VolunteerModule } from './volunteer/volunteer.module';
import { OrganizationModule } from './organization/organization.module';
import { EventModule } from './event/event.module';
import { SocialModule } from './social/social.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CertificateModule } from './certificate/certificate.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core/constants';


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
    CertificateModule,
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 60000,
      limit: 20,
    }]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }