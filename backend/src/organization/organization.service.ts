import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
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
  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
  ) {}

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

    // Check if current viewer follows this org (used to hydrate the Follow button)
    let isFollowedByCurrentUser = false;
    if (viewerId && !isOwner) {
      const { data: followRecord } = await client
        .from('follows')
        .select('id')
        .eq('follower_id', viewerId)
        .eq('following_id', identity.user_id)
        .maybeSingle();
      isFollowedByCurrentUser = !!followRecord;
    }

    const { count: followersCount } = await client
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.user_id);

    // Compute impact stats directly — no RPC dependency
    const { data: completedEvents } = await client
      .from('events')
      .select('id, start_time, end_time')
      .eq('organization_id', profile.id)
      .eq('status', 'completed');

    const eventIds = (completedEvents || []).map((e: any) => e.id);

    const { data: attendedRegs } = eventIds.length
      ? await client
          .from('event_registrations')
          .select('event_id, user_id')
          .in('event_id', eventIds)
          .in('registration_status', ['completed', 'checked_in'])
      : { data: [] };

    const eventsHosted = completedEvents?.length ?? 0;
    const volunteersEngaged = new Set((attendedRegs || []).map((r: any) => r.user_id)).size;

    let totalHours = 0;
    for (const ev of completedEvents || []) {
      const attendees = (attendedRegs || []).filter((r: any) => r.event_id === ev.id).length;
      if (attendees > 0 && ev.start_time && ev.end_time) {
        const [sh, sm] = (ev.start_time as string).split(':').map(Number);
        const [eh, em] = (ev.end_time as string).split(':').map(Number);
        const hours = Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
        totalHours += hours * attendees;
      }
    }

    return {
      profile: {
        ...profile,
        is_owner: isOwner,
        is_followed_by_current_user: isFollowedByCurrentUser,
        followers_count: followersCount ?? 0,
        total_hours_generated: Math.round(totalHours * 10) / 10,
        volunteers_engaged: volunteersEngaged,
        events_hosted: eventsHosted,
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
      .from('organization_reviews')
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

    // Fire-and-forget: notify the org they have a new follower.
    // Look up the org's auth user_id (recipient_id must reference auth.users).
    const { data: orgProfile } = await client
      .from('organization_profiles')
      .select('user_id')
      .or(`id.eq.${targetUserId},user_id.eq.${targetUserId}`)
      .maybeSingle();

    if (orgProfile?.user_id) {
      this.notifications.createNotification(
        orgProfile.user_id,
        currentUserId,
        'new_follower',
        'started following your organization.',
      );
    }

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

  async getOrgVolunteers(orgId: string, requestingUserId: string) {
    const client = this.supabase.getClient();

    // Ownership check: the requesting user must own this org profile
    const { data: callerOrg } = await client
      .from('organization_profiles')
      .select('id')
      .eq('user_id', requestingUserId)
      .maybeSingle();

    if (!callerOrg || callerOrg.id !== orgId) {
      throw new ForbiddenException('Access denied');
    }

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