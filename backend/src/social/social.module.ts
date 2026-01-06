import { Module } from '@nestjs/common';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule], // We need Supabase to search/follow
  controllers: [SocialController],
  providers: [SocialService],
})
export class SocialModule {}