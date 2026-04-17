import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SocialService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  // --- GLOBAL SEARCH ---
  async globalSearch(query: string) {
    if (!query) return [];
    const client = this.supabase.getClient();
    const searchTerm = `%${query}%`;

    const { data: vols } = await client
      .from('volunteer_profiles')
      .select('user_id, full_name, avatar_url, city, is_verified')
      .ilike('full_name', searchTerm)
      .limit(5);

    const { data: orgs } = await client
      .from('organization_profiles')
      .select('id, user_id, name, logo_url, area_locality, is_verified')
      .ilike('name', searchTerm)
      .limit(5);

    const formattedVols = (vols || []).map(v => ({
      type: 'volunteer',
      id: v.user_id,
      name: v.full_name,
      subtitle: v.city || 'Volunteer',
      image: v.avatar_url,
      verified: v.is_verified
    }));

    const formattedOrgs = (orgs || []).map(o => ({
      type: 'org',
      id: o.id,
      target_user_id: o.user_id,
      name: o.name,
      subtitle: o.area_locality || 'Organization',
      image: o.logo_url,
      verified: o.is_verified
    }));

    return [...formattedVols, ...formattedOrgs];
  }

  // --- PRIVACY-AWARE FOLLOW ---
  async followUser(followerId: string, targetId: string) {
    if (followerId === targetId) throw new BadRequestException('You cannot follow yourself');
    const client = this.supabase.getClient();

    // Return early if a row already exists (idempotent)
    const { data: existing } = await client
      .from('follows')
      .select('id, status')
      .eq('follower_id', followerId)
      .eq('following_id', targetId)
      .maybeSingle();

    if (existing) return { status: existing.status };

    // Check if target volunteer has a private account
    const { data: targetProfile } = await client
      .from('volunteer_profiles')
      .select('is_private')
      .eq('user_id', targetId)
      .maybeSingle();

    const isPrivate = targetProfile?.is_private ?? false;
    const followStatus = isPrivate ? 'pending' : 'accepted';

    const { error } = await client
      .from('follows')
      .insert({ follower_id: followerId, following_id: targetId, status: followStatus });

    if (error) {
      if (error.code === '23505') return { status: followStatus };
      throw new BadRequestException(error.message);
    }

    if (isPrivate) {
      this.notifications.createNotification(targetId, followerId, 'follow_request', 'sent you a follow request.');
    } else {
      this.notifications.createNotification(targetId, followerId, 'new_follower', 'started following you.');
    }

    return { status: followStatus };
  }

  async unfollowUser(followerId: string, targetId: string) {
    const client = this.supabase.getClient();
    const { error } = await client
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', targetId);

    if (error) throw error;
    return { message: 'Unfollowed' };
  }

  async getFollowStatus(followerId: string, targetId: string) {
    const client = this.supabase.getClient();
    const { data } = await client
      .from('follows')
      .select('status')
      .eq('follower_id', followerId)
      .eq('following_id', targetId)
      .maybeSingle();

    return { followStatus: (data?.status as 'pending' | 'accepted') ?? 'none' };
  }

  // --- FOLLOW REQUEST MANAGEMENT ---
  // Params use requester's user_id (not the row UUID) so the notification UI can call
  // these directly from actor_id without a separate lookup.

  async acceptFollowRequest(requesterId: string, currentUserId: string) {
    const client = this.supabase.getClient();

    const { data: existing } = await client
      .from('follows')
      .select('id')
      .eq('follower_id', requesterId)
      .eq('following_id', currentUserId)
      .eq('status', 'pending')
      .maybeSingle();

    if (!existing) throw new NotFoundException('Follow request not found');

    await client.from('follows').update({ status: 'accepted' }).eq('id', existing.id);

    // Notify the requester that their request was accepted
    this.notifications.createNotification(
      requesterId,
      currentUserId,
      'follow_accepted',
      'accepted your follow request.',
    );

    return { message: 'Follow request accepted' };
  }

  async rejectFollowRequest(requesterId: string, currentUserId: string) {
    const client = this.supabase.getClient();

    const { error } = await client
      .from('follows')
      .delete()
      .eq('follower_id', requesterId)
      .eq('following_id', currentUserId)
      .eq('status', 'pending');

    if (error) throw error;
    return { message: 'Follow request rejected' };
  }

  // --- REMOVE FOLLOWER (force-remove someone from your own followers) ---
  async removeFollower(currentUserId: string, followerId: string) {
    const client = this.supabase.getClient();

    const { error } = await client
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', currentUserId);

    if (error) throw error;
    return { message: 'Follower removed' };
  }

  // --- FOLLOWERS / FOLLOWING LISTS ---
  private async assertCanViewSocialGraph(
    targetUserId: string,
    viewerId: string | null,
    client: any,
  ) {
    const { data: targetProfile } = await client
      .from('volunteer_profiles')
      .select('is_private')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!targetProfile) throw new NotFoundException('User not found');

    const isSelf = viewerId === targetUserId;
    if (!targetProfile.is_private || isSelf) return;

    if (viewerId) {
      const { data: followRecord } = await client
        .from('follows')
        .select('id')
        .eq('follower_id', viewerId)
        .eq('following_id', targetUserId)
        .eq('status', 'accepted')
        .maybeSingle();
      if (followRecord) return;
    }

    throw new ForbiddenException('This account is private');
  }

  // Batch-build a map of { userId → followStatus } for the viewer
  // relative to a given list of user IDs. One query, zero N+1.
  private async buildViewerStatusMap(
    viewerId: string | null,
    userIds: string[],
    client: any,
  ): Promise<Record<string, 'none' | 'pending' | 'accepted'>> {
    if (!viewerId || !userIds.length) return {};

    const { data: rows } = await client
      .from('follows')
      .select('following_id, status')
      .eq('follower_id', viewerId)
      .in('following_id', userIds);

    const map: Record<string, 'none' | 'pending' | 'accepted'> = {};
    for (const row of rows ?? []) {
      map[row.following_id] = row.status;
    }
    return map;
  }

  async getFollowers(targetUserId: string, viewerId: string | null) {
    const client = this.supabase.getClient();
    await this.assertCanViewSocialGraph(targetUserId, viewerId, client);

    const { data: follows } = await client
      .from('follows')
      .select('follower_id')
      .eq('following_id', targetUserId)
      .eq('status', 'accepted');

    if (!follows?.length) return { followers: [] };
    const ids = follows.map((f: any) => f.follower_id);

    const [profilesResult, statusMap] = await Promise.all([
      client
        .from('volunteer_profiles')
        .select('user_id, full_name, avatar_url, city, headline')
        .in('user_id', ids),
      this.buildViewerStatusMap(viewerId, ids, client),
    ]);

    const followers = (profilesResult.data ?? []).map((p: any) => ({
      ...p,
      requester_follow_status: statusMap[p.user_id] ?? 'none',
    }));

    return { followers };
  }

  async getFollowing(targetUserId: string, viewerId: string | null) {
    const client = this.supabase.getClient();
    await this.assertCanViewSocialGraph(targetUserId, viewerId, client);

    const { data: follows } = await client
      .from('follows')
      .select('following_id')
      .eq('follower_id', targetUserId)
      .eq('status', 'accepted');

    if (!follows?.length) return { following: [] };
    const ids = follows.map((f: any) => f.following_id);

    const [profilesResult, statusMap] = await Promise.all([
      client
        .from('volunteer_profiles')
        .select('user_id, full_name, avatar_url, city, headline')
        .in('user_id', ids),
      this.buildViewerStatusMap(viewerId, ids, client),
    ]);

    const following = (profilesResult.data ?? []).map((p: any) => ({
      ...p,
      requester_follow_status: statusMap[p.user_id] ?? 'none',
    }));

    return { following };
  }
}
