import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateOrganizationProfileDto } from './dto/update-organization-profile.dto';
import { AddReviewDto } from './dto/add-review.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly supabase: SupabaseService) { }

  // 1. GET PUBLIC PROFILE
  async getPublicProfile(orgId: string, viewerId?: string) {
    const client = this.supabase.getClient();

    // A. Resolve ID (Handle User ID vs Org ID)
    let targetId = orgId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
    
    let { data: profile, error } = await client
      .from('organization_profiles')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();

    if (error || !profile) {
       const { data: profileByUserId } = await client
        .from('organization_profiles')
        .select('*')
        .eq('user_id', targetId)
        .single();
       if (!profileByUserId) throw new NotFoundException('Organization not found');
       profile = profileByUserId;
    }

    // B. Security Check
    const isOwner = viewerId && profile.user_id === viewerId;
    const returnedProfile = { ...profile };
    
    if (!isOwner) {
      returnedProfile.pan_card_url = null;
      returnedProfile.registration_certificate_url = null;
      returnedProfile.proof_document_url = null;
      returnedProfile.signature_url = null;
      returnedProfile.view_type = 'public';
    } else {
      returnedProfile.view_type = 'private';
    }

    // C. Fetch Followers
    const { count: followersCount } = await client
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.user_id);

    // D. ✅ CALL THE SQL FUNCTION FOR REAL STATS
    // This bypasses the RLS issue causing the "Zero" bug
    const { data: stats, error: statsError } = await client.rpc('get_org_stats', { 
        target_org_id: profile.id 
    });

    if (statsError) {
        console.error("Stats Error:", statsError);
    }

    return {
      profile: {
        ...returnedProfile,
        followers_count: followersCount || 0,
        // ✅ Map SQL results to frontend
        total_hours_generated: stats?.total_hours || 0,
        volunteers_engaged: stats?.volunteers_engaged || 0,
        events_hosted: stats?.events_hosted || 0
      }
    };
  }

  // 2. GET ORG EVENTS
  async getOrgEvents(orgId: string) {
    const client = this.supabase.getClient();

    let targetId = orgId;
    const { data: p } = await client.from('organization_profiles').select('id').eq('user_id', orgId).maybeSingle();
    if(p) targetId = p.id;
    const finalId = p ? p.id : orgId; 

    const { data: events, error } = await client
      .from('events')
      .select('*')
      .eq('organization_id', finalId)
      .in('status', ['published', 'ongoing', 'completed']) 
      .order('event_date', { ascending: false });

    if (error) return { events: [] };

    // Get counts
    const eventsWithCounts = await Promise.all(events.map(async (event) => {
        const { count } = await client
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);
        
        return { ...event, registered_count: count || 0 };
    }));

    return { events: eventsWithCounts };
  }

  // 3. GET REVIEWS (Keep existing)
  async getOrgReviews(orgId: string) {
    const client = this.supabase.getClient();
    let targetId = orgId;
    const { data: p } = await client.from('organization_profiles').select('id').eq('user_id', orgId).maybeSingle();
    if(p) targetId = p.id;
    const finalId = p ? p.id : orgId;

    const { data: reviews } = await client
      .from('organization_reviews')
      .select(`*, volunteers:volunteer_profiles(full_name), events(title)`)
      .eq('organization_id', finalId)
      .order('created_at', { ascending: false });

    const formattedReviews = reviews?.map((r: any) => ({
      ...r,
      volunteer_name: r.volunteers?.full_name || 'Anonymous',
      event_title: r.events?.title || 'General Review'
    })) || [];

    return { reviews: formattedReviews };
  }

  // ... (UpdateProfile, ToggleFollow, CheckFollowStatus, GetOrgVolunteers, AddReview remain unchanged)
  async updateProfile(userId: string, dto: UpdateOrganizationProfileDto) {
    const client = this.supabase.getClient();
    const { data: profile } = await client.from('organization_profiles').select('id').eq('user_id', userId).single();
    if (!profile) throw new NotFoundException('Profile not found');
    const { org_type, ...updateData } = dto as any;
    const { data, error } = await client.from('organization_profiles').update({ ...updateData }).eq('id', profile.id).select().single();
    if (error) throw error;
    return { profile: data };
  }

  async toggleFollow(orgId: string, userId: string) {
    const client = this.supabase.getClient();
    const { data: existing } = await client.from('follows').select('id').eq('following_id', orgId).eq('follower_id', userId).maybeSingle();
    if (existing) {
      await client.from('follows').delete().eq('id', existing.id);
      return { message: 'Unfollowed', isFollowing: false };
    } else {
      await client.from('follows').insert({ following_id: orgId, follower_id: userId });
      return { message: 'Following', isFollowing: true };
    }
  }

  async checkFollowStatus(orgId: string, userId: string) {
    const client = this.supabase.getClient();
    const { data } = await client.from('follows').select('id').eq('following_id', orgId).eq('follower_id', userId).maybeSingle();
    return { isFollowing: !!data };
  }

  async getOrgVolunteers(orgId: string, userId: string) {
    const client = this.supabase.getClient();
    const { data } = await client.from('event_registrations').select('*, volunteer_profiles(*)').eq('events.organization_id', orgId);
    return { volunteers: data || [] };
  }

  async addReview(userId: string, dto: AddReviewDto) {
    const client = this.supabase.getClient();
    const { data: volunteer } = await client.from('volunteer_profiles').select('id').eq('user_id', userId).single();
    if (!volunteer) throw new ForbiddenException('Only volunteers can leave reviews');
    const { data, error } = await client.from('organization_reviews').insert({ ...dto, volunteer_id: volunteer.id }).select().single();
    if (error) throw error;
    return { review: data };
  }
}