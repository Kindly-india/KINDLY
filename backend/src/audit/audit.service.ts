import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuditService {
  constructor(private readonly supabase: SupabaseService) {}

  // Fire-and-forget insert, non-fatal on error — copies
  // notifications.service.ts's exact pattern so a logging failure can never
  // block the real (sensitive) action it's recording.
  async log(
    actorId: string,
    actorEmail: string | null,
    action: string,
    targetType: string,
    targetId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const client = this.supabase.getClient();
    const { error } = await client.from('audit_log').insert({
      actor_id: actorId,
      actor_email: actorEmail,
      action,
      target_type: targetType,
      target_id: targetId,
      metadata: metadata ?? null,
    });
    if (error) {
      console.error('Failed to write audit log:', error.message);
    }
  }
}
