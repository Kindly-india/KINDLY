import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { AdminGuard } from '../auth/guards/admin.guard';

@Module({
  imports: [SupabaseModule, NotificationsModule, EmailModule],
  controllers: [OrganizationController],
  providers: [OrganizationService, AdminGuard],
  exports: [OrganizationService]
})
export class OrganizationModule {}