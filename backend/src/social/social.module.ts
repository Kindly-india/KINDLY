import { Module } from '@nestjs/common';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [SupabaseModule, NotificationsModule],
  controllers: [SocialController],
  providers: [SocialService],
})
export class SocialModule {}