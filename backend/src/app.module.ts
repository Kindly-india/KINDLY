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
import { NotificationsModule } from './notifications/notifications.module';
import { EmailModule } from './email/email.module';
import { VolunteerContactModule } from './volunteer-contact/volunteer-contact.module';
import { PostsModule } from './posts/posts.module';
import { PaymentsModule } from './payments/payments.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserThrottlerGuard } from './common/user-throttler.guard';
import { APP_GUARD } from '@nestjs/core/constants';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
    NotificationsModule,
    EmailModule,
    VolunteerContactModule,
    PostsModule,
    PaymentsModule,
    // Global catch-all limit. Keyed per-USER for authenticated requests (see
    // UserThrottlerGuard), so 100/min is generous headroom for normal SPA usage
    // (a page fires several API calls) while still stopping runaway loops. The
    // abuse-prone endpoints (signup, reset, post, follow, comment) set their own
    // tighter @Throttle({ short: ... }) overrides on top of this.
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 60000,
      limit: 100,
    }]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard,
    },
  ],
})
export class AppModule { }