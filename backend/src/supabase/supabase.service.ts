import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    // Use service_role key for admin operations in backend
    this.supabase = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'), // We'll add this to .env
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Single source of truth for "is this user an admin", used by AdminGuard
  // and every ad-hoc admin-or-owner check elsewhere (payments/certificate
  // services).
  async isAdmin(userId: string): Promise<boolean> {
    const { data: adminRow } = await this.supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .maybeSingle();

    return !!adminRow;
  }
}
