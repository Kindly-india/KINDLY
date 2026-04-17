import { Injectable, BadRequestException } from '@nestjs/common';
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

    // 1. Search Volunteers
    const { data: vols } = await client
      .from('volunteer_profiles')
      .select('user_id, full_name, avatar_url, city, is_verified')
      .ilike('full_name', searchTerm)
      .limit(5);

    // 2. Search Organizations
    const { data: orgs } = await client
      .from('organization_profiles')
      .select('id, user_id, name, logo_url, area_locality, is_verified') // Select ID (UUID) and User_ID
      .ilike('name', searchTerm)
      .limit(5);

    // 3. Format & Merge Results
    const formattedVols = (vols || []).map(v => ({
      type: 'volunteer',
      // ⚠️ IMPORTANT: Must be user_id because Volunteer Profile looks up by user_id
      id: v.user_id, 
      name: v.full_name,
      subtitle: v.city || 'Volunteer',
      image: v.avatar_url,
      verified: v.is_verified
    }));

    const formattedOrgs = (orgs || []).map(o => ({
      type: 'org',
      // ⚠️ IMPORTANT: Must be id (UUID) because Org Profile looks up by UUID
      id: o.id, 
      target_user_id: o.user_id, // Needed for following logic
      name: o.name,
      subtitle: o.area_locality || 'Organization',
      image: o.logo_url,
      verified: o.is_verified
    }));

    return [...formattedVols, ...formattedOrgs];
  }

  // --- GENERIC FOLLOW ---
  async followUser(followerId: string, targetId: string) {
    if (followerId === targetId) throw new BadRequestException("You cannot follow yourself");
    
    const client = this.supabase.getClient();
    
    // We use .select() to check if it worked, but rely on the DB constraint
    const { error } = await client
      .from('follows')
      .insert({ follower_id: followerId, following_id: targetId });

    if (error) {
       // ✅ Handle Duplicate Error Code (Postgres Unique Violation)
       if (error.code === '23505') {
           return { message: 'Already following' }; // Success! Just don't add again.
       }

       console.error("Follow Error:", error);
       throw new BadRequestException(error.message);
    }

    // Fire-and-forget: notify the target they have a new follower
    this.notifications.createNotification(
      targetId,
      followerId,
      'new_follower',
      'started following you.',
    );

    return { message: 'Followed successfully' };
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
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', targetId)
      .maybeSingle();

    return { isFollowing: !!data };
  }
}