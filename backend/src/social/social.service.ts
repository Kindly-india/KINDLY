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

    // Organizations are broadcast-only — they cannot follow anyone
    const { data: orgCheck } = await client
      .from('organization_profiles')
      .select('id')
      .eq('user_id', followerId)
      .maybeSingle();
    if (orgCheck) throw new ForbiddenException('Organizations cannot follow other accounts.');

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

    if (error) throw new BadRequestException(error.message);

    // Clean up any pending follow_request notification from this actor (no-op if none)
    await client.from('notifications').delete()
      .eq('recipient_id', targetId)
      .eq('actor_id', followerId)
      .eq('type', 'follow_request');

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

    const { data: updated, error: updateError } = await client
      .from('follows')
      .update({ status: 'accepted' })
      .eq('id', existing.id)
      .select('id');

    if (updateError) throw new BadRequestException(updateError.message);
    if (!updated?.length) throw new NotFoundException('Follow request no longer exists');

    // Clean up the source follow_request notification
    await client.from('notifications').delete()
      .eq('recipient_id', currentUserId)
      .eq('actor_id', requesterId)
      .eq('type', 'follow_request');

    // Notify the requester their request was accepted
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

    const { data: existing } = await client
      .from('follows')
      .select('id')
      .eq('follower_id', requesterId)
      .eq('following_id', currentUserId)
      .eq('status', 'pending')
      .maybeSingle();

    if (!existing) throw new NotFoundException('Follow request not found or already processed');

    const { error } = await client
      .from('follows')
      .delete()
      .eq('id', existing.id);

    if (error) throw new BadRequestException(error.message);

    // Clean up the source follow_request notification
    await client.from('notifications').delete()
      .eq('recipient_id', currentUserId)
      .eq('actor_id', requesterId)
      .eq('type', 'follow_request');

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

    if (error) throw new BadRequestException(error.message);
    return { message: 'Follower removed' };
  }

  // --- FOLLOWERS / FOLLOWING LISTS ---
  private async assertCanViewSocialGraph(
    targetUserId: string,
    viewerId: string | null,
    client: any,
  ) {
    // Self-view: always allowed — skip the DB lookup entirely
    if (viewerId && viewerId === targetUserId) return;

    const { data: targetProfile } = await client
      .from('volunteer_profiles')
      .select('is_private')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!targetProfile) throw new NotFoundException('User not found');

    // Public profile: always allowed
    if (!targetProfile.is_private) return;

    // Private profile: viewer must have an accepted follow
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

  // Normalise a raw volunteer_profiles row into the common social-list shape.
  private normalizeVolunteer(p: any, statusMap: Record<string, string>) {
    return {
      user_id: p.user_id,
      profile_id: p.user_id,      // volunteer URL uses user_id
      entity_type: 'volunteer' as const,
      full_name: p.full_name,
      avatar_url: p.avatar_url ?? null,
      city: p.city ?? null,
      headline: p.headline ?? null,
      is_verified: p.is_verified ?? false,
      requester_follow_status: (statusMap[p.user_id] ?? 'none') as 'none' | 'pending' | 'accepted',
    };
  }

  // Normalise a raw organization_profiles row into the same shape.
  private normalizeOrg(o: any, statusMap: Record<string, string>) {
    return {
      user_id: o.user_id,
      profile_id: o.id,            // org URL uses the profile UUID, not user_id
      entity_type: 'org' as const,
      full_name: o.name,
      avatar_url: o.logo_url ?? null,
      city: o.area_locality ?? null,
      headline: null,
      is_verified: o.is_verified ?? false,
      requester_follow_status: (statusMap[o.user_id] ?? 'none') as 'none' | 'pending' | 'accepted',
    };
  }

  // Fetch volunteer + org profiles for a given set of user_ids, returning a
  // unified list. Both tables are queried in parallel; org rows fill the gaps
  // for any user_id not found in volunteer_profiles.
  private async buildProfileList(ids: string[], viewerId: string | null, client: any) {
    const [volResult, orgResult, statusMap] = await Promise.all([
      client
        .from('volunteer_profiles')
        .select('user_id, full_name, avatar_url, city, headline, is_verified')
        .in('user_id', ids),
      client
        .from('organization_profiles')
        .select('id, user_id, name, logo_url, area_locality, is_verified')
        .in('user_id', ids),
      this.buildViewerStatusMap(viewerId, ids, client),
    ]);

    const volUserIds = new Set((volResult.data ?? []).map((p: any) => p.user_id));

    return [
      ...(volResult.data ?? []).map((p: any) => this.normalizeVolunteer(p, statusMap)),
      // Only include orgs whose user_id isn't already in volunteer_profiles
      // (a user_id belongs to exactly one type, but this guards against surprises)
      ...(orgResult.data ?? [])
        .filter((o: any) => !volUserIds.has(o.user_id))
        .map((o: any) => this.normalizeOrg(o, statusMap)),
    ];
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

    const followers = await this.buildProfileList(ids, viewerId, client);
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

    const following = await this.buildProfileList(ids, viewerId, client);
    return { following };
  }

  // --- PENDING FOLLOW REQUESTS INBOX ---
  async getPendingFollowRequests(currentUserId: string) {
    const client = this.supabase.getClient();

    // All rows where someone is waiting for currentUser to approve
    const { data: follows, error } = await client
      .from('follows')
      .select('follower_id, created_at')
      .eq('following_id', currentUserId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    if (!follows?.length) return { requests: [], count: 0 };

    const requesterIds = follows.map((f: any) => f.follower_id);

    const { data: profiles } = await client
      .from('volunteer_profiles')
      .select('user_id, full_name, avatar_url, city, headline, is_verified')
      .in('user_id', requesterIds);

    const profileMap = Object.fromEntries(
      (profiles ?? []).map((p: any) => [p.user_id, p]),
    );

    const requests = follows
      .map((f: any) => {
        const p = profileMap[f.follower_id];
        if (!p) return null; // org followers not in volunteer_profiles — skip
        return {
          requester_id: p.user_id,
          full_name: p.full_name,
          avatar_url: p.avatar_url ?? null,
          city: p.city ?? null,
          headline: p.headline ?? null,
          is_verified: p.is_verified ?? false,
          requested_at: f.created_at,
        };
      })
      .filter(Boolean);

    return { requests, count: requests.length };
  }

  // --- SEARCH HISTORY ---

  async getSearchHistory(userId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    return data ?? [];
  }

  async saveSearchHistory(userId: string, item: {
    result_id: string;
    result_type: string;
    result_name: string;
    result_image?: string | null;
  }) {
    const client = this.supabase.getClient();
    // Remove existing entry for same result to re-insert as most recent
    await client
      .from('search_history')
      .delete()
      .eq('user_id', userId)
      .eq('result_id', item.result_id);

    const { data, error } = await client
      .from('search_history')
      .insert({
        user_id: userId,
        result_id: item.result_id,
        result_type: item.result_type,
        result_name: item.result_name,
        result_image: item.result_image ?? null,
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async clearSearchHistory(userId: string) {
    const client = this.supabase.getClient();
    const { error } = await client
      .from('search_history')
      .delete()
      .eq('user_id', userId);
    if (error) throw new BadRequestException(error.message);
    return { message: 'History cleared' };
  }

  async removeSearchHistoryItem(userId: string, id: string) {
    const client = this.supabase.getClient();
    const { error } = await client
      .from('search_history')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw new BadRequestException(error.message);
    return { message: 'Item removed' };
  }

}
