import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateOrganizationProfileDto } from './dto/update-organization-profile.dto';
import { AddReviewDto } from './dto/add-review.dto';

export interface OrgProfilePublic {
  id: string;
  user_id: string;
  org_type: string;
  name: string;
  email: string;
  phone: string;
  registration_type: string | null;
  representative_name: string | null;
  designation: string | null;
  website: string | null;
  parent_institution: string | null;
  coordinator_name: string | null;
  area_locality: string | null;
  intent_description: string | null;
  approval_status: string;
  created_at: string;
  updated_at: string;
  logo_url: string | null;
  cover_url: string | null;
  tagline: string | null;
  mission_statement: string | null;
  years_active: number | null;
  is_verified: boolean;
  linkedin: string | null;
  instagram: string | null;
  team_members: object[];
  achievements: object[];
}

export interface OrgProfilePrivate extends OrgProfilePublic {
  registration_number: string | null;
  pan_card_url: string | null;
  registration_certificate_url: string | null;
  proof_document_url: string | null;
  signature_url: string | null;
}

const PUBLIC_ORG_FIELDS = [
  'id', 'user_id', 'org_type', 'name', 'email', 'phone',
  'registration_type', 'representative_name', 'designation',
  'website', 'parent_institution', 'coordinator_name',
  'area_locality', 'intent_description', 'approval_status',
  'created_at', 'updated_at', 'logo_url', 'cover_url',
  'tagline', 'mission_statement', 'years_active', 'is_verified',
  'linkedin', 'instagram', 'team_members', 'achievements',
].join(', ');

const PRIVATE_ORG_FIELDS = PUBLIC_ORG_FIELDS + ', registration_number, pan_card_url, registration_certificate_url, proof_document_url, signature_url';

@Injectable()
export class OrganizationService {
  constructor(private readonly supabase: SupabaseService) { }

  async getPublicProfile(orgId: string, viewerId?: string) {
    const client = this.supabase.getClient();

    let { data: identity } = await client
      .from('organization_profiles')
      .select('id, user_id')
      .eq('id', orgId)
      .maybeSingle();

    if (!identity) {
      const { data: byUserId } = await client
        .from('organization_profiles')
        .select('id, user_id')
        .eq('user_id', orgId)
        .maybeSingle();

      if (!byUserId) throw new NotFoundException('Organization not found');
      identity = byUserId;
    }

    const isOwner = viewerId === identity.user_id;

    const { data, error } = await client
      .from('organization_profiles')
      .select(isOwner ? PRIVATE_ORG_FIELDS : PUBLIC_ORG_FIELDS)
      .eq('id', identity.id)
      .single();

    const profile = data as OrgProfilePrivate | null;

    if (error || !profile) throw new NotFoundException('Organization not found');

    const { count: followersCount } = await client
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.user_id);

    const { data: stats, error: statsError } = await client.rpc('get_org_stats', {
      target_org_id: profile.id,
    });

    if (statsError) {
      console.error('Stats Error:', statsError);
    }

    return {
      profile: {
        ...profile,
        is_owner: isOwner,
        followers_count: followersCount ?? 0,
        total_hours_generated: stats?.total_hours ?? 0,
        volunteers_engaged: stats?.volunteers_engaged ?? 0,
        events_hosted: stats?.events_hosted ?? 0,
      },
    };
  }

  async getOrgEvents(orgId: string) {
    const client = this.supabase.getClient();

    const { data: p } = await client
      .from('organization_profiles')
      .select('id')
      .eq('user_id', orgId)
      .maybeSingle();

    const finalId = p ? p.id : orgId;

    const { data: events, error } = await client
      .from('events')
      .select('*')
      .eq('organization_id', finalId)
      .in('status', ['published', 'completed'])
      .order('event_date', { ascending: false });

    if (error) return { events: [] };

    return { events };
  }

  async getOrgReviews(orgId: string) {
    const client = this.supabase.getClient();

    const { data: reviews, error } = await client
      .from('org_reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        volunteer_profiles (
          full_name,
          avatar_url
        ),
        events (
          title
        )
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) return { reviews: [] };

    return {
      reviews: reviews.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        volunteer_name: r.volunteer_profiles?.full_name ?? 'Anonymous',
        volunteer_avatar: r.volunteer_profiles?.avatar_url ?? null,
        event_title: r.events?.title ?? 'General',
      })),
    };
  }

  async updateProfile(userId: string, dto: UpdateOrganizationProfileDto) {
    const client = this.supabase.getClient();

    const { data: existing } = await client
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!existing) throw new NotFoundException('Profile not found');

    const { org_type, ...updateData } = dto as any;

    const { data, error } = await client
      .from('organization_profiles')
      .update(updateData)
      .eq('id', existing.id)
      .select(PRIVATE_ORG_FIELDS)
      .single();

    const profile = data as OrgProfilePrivate | null;

    if (error || !profile) throw error;
    return { profile };
  }

  async toggleFollow(targetUserId: string, currentUserId: string) {
    const client = this.supabase.getClient();

    const { data: existing } = await client
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .maybeSingle();

    if (existing) {
      await client.from('follows').delete().eq('id', existing.id);
      return { isFollowing: false };
    }

    const { error } = await client.from('follows').insert({
      follower_id: currentUserId,
      following_id: targetUserId,
    });

    if (error) throw new Error(error.message);
    return { isFollowing: true };
  }

  async checkFollowStatus(orgId: string, userId: string) {
    const client = this.supabase.getClient();

    const { data } = await client
      .from('follows')
      .select('id')
      .eq('following_id', orgId)
      .eq('follower_id', userId)
      .maybeSingle();

    return { isFollowing: !!data };
  }

  async getOrgVolunteers(orgId: string) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('event_registrations')
      .select(`
      volunteer_id,
      status,
      volunteer_profiles (
        id, full_name, avatar_url, city, headline, total_hours
      ),
      events!inner (organization_id)
    `)
      .eq('events.organization_id', orgId);

    if (error) return { volunteers: [] };

    // Deduplicate by volunteer_id, prioritise checked_in over registered
    const seen = new Map();
    for (const reg of data ?? []) {
      const id = reg.volunteer_id;
      if (!seen.has(id) || reg.status === 'checked_in') {
        seen.set(id, reg.volunteer_profiles);
      }
    }

    return { volunteers: Array.from(seen.values()) };
  }

  async addReview(userId: string, dto: AddReviewDto) {
    const client = this.supabase.getClient();

    const { data: volunteer } = await client
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!volunteer) throw new ForbiddenException('Only volunteers can leave reviews');

    const { data, error } = await client
      .from('organization_reviews')
      .insert({ ...dto, volunteer_id: volunteer.id })
      .select()
      .single();

    if (error) throw error;
    return { review: data };
  }
}