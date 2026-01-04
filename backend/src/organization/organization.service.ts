import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateOrganizationProfileDto } from './dto/update-organization-profile.dto';
import { AddReviewDto } from './dto/add-review.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly supabase: SupabaseService) { }

  async getPublicProfile(orgId: string, userId?: string) {
    const client = this.supabase.getClient();

    // Get org profile
    const { data: profile, error: profileError } = await client
      .from('organization_profiles')
      .select('*')
      .eq('id', orgId)
      .single();

    if (profileError) throw new NotFoundException('Organization not found');

    // Get event stats
    const { data: events } = await client
      .from('events')
      .select('id, registered_count')
      .eq('organization_id', orgId);

    const totalEvents = events?.length || 0;
    const livesTouched = events?.reduce((sum, e) => sum + (e.registered_count || 0), 0) || 0;

    // Get followers count
    const { count: followersCount } = await client
      .from('org_followers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    // Check if current user follows
    let isFollowing = false;
    if (userId) {
      const { data: volunteer } = await client
        .from('volunteer_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (volunteer) {
        const { data: follow } = await client
          .from('org_followers')
          .select('id')
          .eq('organization_id', orgId)
          .eq('volunteer_id', volunteer.id)
          .maybeSingle();

        isFollowing = !!follow;
      }
    }

    return {
      profile: {
        ...profile,
        total_events: totalEvents,
        lives_touched: livesTouched,
        followers_count: followersCount || 0
      },
      isFollowing
    };
  }

  // ✅ CORRECT - Return all, let frontend filter
  async getOrgEvents(orgId: string) {
    const client = this.supabase.getClient();

    const { data: events, error } = await client
      .from('events')
      .select('*')
      .eq('organization_id', orgId)
      .eq('status', 'published')  // Only published
      // ✅ Removed .gte() - return all dates
      .order('event_date', { ascending: false });  // ✅ Latest first

    if (error) throw error;
    return { events: events || [] };
  }

  async getOrgReviews(orgId: string) {
    const client = this.supabase.getClient();

    const { data: reviews, error } = await client
      .from('org_reviews')
      .select(`
        *,
        volunteer_profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedReviews = reviews?.map((r: any) => ({
      ...r,
      volunteer_name: r.volunteer_profiles?.full_name
    })) || [];

    return { reviews: formattedReviews };
  }

  async getOrgVolunteers(orgId: string, userId: string) {
    const client = this.supabase.getClient();

    // Verify user owns this org
    const { data: org } = await client
      .from('organization_profiles')
      .select('id')
      .eq('id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!org) throw new ForbiddenException('Unauthorized');

    // Get all unique volunteers who registered for org's events
    const { data: events } = await client
      .from('events')
      .select('id')
      .eq('organization_id', orgId);

    const eventIds = events?.map(e => e.id) || [];

    if (eventIds.length === 0) {
      return { volunteers: [] };
    }

    const { data: registrations } = await client
      .from('event_registrations')
      .select('volunteer_id, volunteer_profiles(*)')
      .in('event_id', eventIds);

    // Get unique volunteers
    const uniqueVolunteers = new Map();
    registrations?.forEach((reg: any) => {
      if (reg.volunteer_profiles && !uniqueVolunteers.has(reg.volunteer_id)) {
        uniqueVolunteers.set(reg.volunteer_id, reg.volunteer_profiles);
      }
    });

    return { volunteers: Array.from(uniqueVolunteers.values()) };
  }

  async updateProfile(userId: string, dto: UpdateOrganizationProfileDto) {
    const client = this.supabase.getClient();

    // Get org profile ID
    const { data: profile } = await client
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!profile) throw new NotFoundException('Profile not found');

    // ✅ Remove org_type from updates (read-only field)
    const { org_type, ...updateData } = dto as any;

    // Update
    const { data, error } = await client
      .from('organization_profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) throw error;

    return { profile: data };
  }

  async toggleFollow(orgId: string, userId: string) {
    const client = this.supabase.getClient();

    // Get volunteer profile
    const { data: volunteer } = await client
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!volunteer) {
      throw new ForbiddenException('Only volunteers can follow organizations');
    }

    // Check if already following
    const { data: existing } = await client
      .from('org_followers')
      .select('id')
      .eq('organization_id', orgId)
      .eq('volunteer_id', volunteer.id)
      .maybeSingle();

    if (existing) {
      // Unfollow
      await client
        .from('org_followers')
        .delete()
        .eq('id', existing.id);

      return { message: 'Unfollowed', isFollowing: false };
    } else {
      // Follow
      await client
        .from('org_followers')
        .insert({
          organization_id: orgId,
          volunteer_id: volunteer.id
        });

      return { message: 'Following', isFollowing: true };
    }
  }

  async checkFollowStatus(orgId: string, userId: string) {
    const client = this.supabase.getClient();

    const { data: volunteer } = await client
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!volunteer) {
      return { isFollowing: false };
    }

    const { data: follow } = await client
      .from('org_followers')
      .select('id')
      .eq('organization_id', orgId)
      .eq('volunteer_id', volunteer.id)
      .maybeSingle();

    return { isFollowing: !!follow };
  }

  async addReview(userId: string, dto: AddReviewDto) {
    const client = this.supabase.getClient();

    // Get volunteer profile
    const { data: volunteer } = await client
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!volunteer) {
      throw new ForbiddenException('Only volunteers can leave reviews');
    }

    // Add review
    const { data, error } = await client
      .from('org_reviews')
      .insert({
        organization_id: dto.organization_id,
        volunteer_id: volunteer.id,
        event_id: dto.event_id,
        rating: dto.rating,
        comment: dto.comment
      })
      .select()
      .single();

    if (error) throw error;

    return { review: data };
  }
}