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

  async getNotifications(userId: string, before?: string) {
    const client = this.supabase.getClient();
    let query = client
      .from('notifications')
      .select(
        'id, recipient_id, actor_id, type, message, read, entity_id, created_at',
      )
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (before) query = query.lt('created_at', before);

    const { data, error } = await query;

    if (error) throw error;
    if (!data?.length) return { notifications: [], hasMore: false };

    const actorIds = [
      ...new Set(data.filter((n) => n.actor_id).map((n) => n.actor_id)),
    ];
    const postEntityIds = [
      ...new Set(
        data
          .filter(
            (n) =>
              (n.type === 'post_liked' || n.type === 'post_commented') &&
              n.entity_id,
          )
          .map((n) => n.entity_id),
      ),
    ];

    // Batch-fetch actor profiles and post thumbnails in parallel
    const [{ data: actors }, { data: posts }] = await Promise.all([
      client
        .from('volunteer_profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', actorIds),
      postEntityIds.length > 0
        ? client.from('posts').select('id, photo_urls').in('id', postEntityIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const actorMap = Object.fromEntries(
      (actors || []).map((a: any) => [a.user_id, a]),
    );
    const thumbnailMap: Record<string, string> = {};
    for (const p of posts ?? []) {
      if (p.photo_urls?.[0]) thumbnailMap[p.id] = p.photo_urls[0];
    }

    const notifications = data.map((n) => ({
      ...n,
      actor_name: actorMap[n.actor_id]?.full_name ?? null,
      actor_avatar: actorMap[n.actor_id]?.avatar_url ?? null,
      post_thumbnail: n.entity_id ? (thumbnailMap[n.entity_id] ?? null) : null,
    }));

    return { notifications, hasMore: data.length === 30 };
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
