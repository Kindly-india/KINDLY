import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly supabase: SupabaseService) {}

  async createNotification(
    recipientId: string,
    actorId: string,
    type: string,
    message: string,
    entityId?: string,
  ) {
    const client = this.supabase.getClient();
    const { error } = await client.from('notifications').insert({
      recipient_id: recipientId,
      actor_id: actorId,
      type,
      message,
      entity_id: entityId ?? null,
    });
    if (error) {
      if (error.code === '23505') return; // Duplicate follow_request — partial unique index, ignore
      // Non-fatal — log and move on. Notification failure should never break the triggering action.
      console.error('Failed to create notification:', error.message);
    }
  }

  async getNotifications(userId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    if (!data?.length) return { notifications: [] };

    // Batch-fetch actor names from volunteer_profiles in one query
    const actorIds = [...new Set(data.filter(n => n.actor_id).map(n => n.actor_id))];
    const { data: actors } = await client
      .from('volunteer_profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', actorIds);

    const actorMap = Object.fromEntries((actors || []).map(a => [a.user_id, a]));

    const notifications = data.map(n => ({
      ...n,
      actor_name: actorMap[n.actor_id]?.full_name ?? null,
      actor_avatar: actorMap[n.actor_id]?.avatar_url ?? null,
    }));

    return { notifications };
  }

  async getUnreadCount(userId: string) {
    const client = this.supabase.getClient();
    const { count, error } = await client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    if (error) throw error;
    return { count: count ?? 0 };
  }

  async markAllRead(userId: string) {
    const client = this.supabase.getClient();
    const { error } = await client
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    if (error) throw error;
    return { message: 'All notifications marked as read' };
  }

  async deleteNotification(userId: string, notifId: string) {
    const client = this.supabase.getClient();
    const { error } = await client
      .from('notifications')
      .delete()
      .eq('id', notifId)
      .eq('recipient_id', userId); // owner-scoped: can only delete your own
    if (error) throw new BadRequestException(error.message);
    return { message: 'Notification deleted' };
  }
}
