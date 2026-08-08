import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { UpdateOrganizationProfileDto } from './dto/update-organization-profile.dto';
import { AddReviewDto } from './dto/add-review.dto';
import { validateImageFile } from '../common/file-validation.util';
import {
  removeFromStorage,
  storagePathFromStored,
} from '../common/storage.util';
import { eventHours } from '../common/hours.util';
import {
  normalizeUrlField,
  normalizeTrimmedField,
  trimAllStrings,
  normalizeTeamMembers,
  normalizeAchievements,
} from '../common/text-normalize.util';

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
  'id',
  'user_id',
  'org_type',
  'name',
  'email',
  'phone',
  'registration_type',
  'representative_name',
  'designation',
  'website',
  'parent_institution',
  'coordinator_name',
  'area_locality',
  'intent_description',
  'approval_status',
  'created_at',
  'updated_at',
  'logo_url',
  'cover_url',
  'tagline',
  'mission_statement',
  'years_active',
  'is_verified',
  'linkedin',
  'instagram',
  'team_members',
  'achievements',
].join(', ');

// upi_id is private (payout destination) — only the org itself and the
// superadmin see it (PaymentsService.getAdminDashboard/getBill read it
// directly from the DB, not through this field list).
const PRIVATE_ORG_FIELDS =
  PUBLIC_ORG_FIELDS +
  ', registration_number, pan_card_url, registration_certificate_url, proof_document_url, signature_url, upi_id';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
    private readonly email: EmailService,
  ) {}

  // ─── Admin approval ─────────────────────────────────────────────────────────

  private static readonly ORG_DOCS_BUCKET = 'organization-documents';

  // KYC docs live in a PRIVATE bucket now, so a stored value is only usable via a
  // short-lived signed URL. Handles both the new format (a bare object path) and
  // legacy rows that stored a full public URL — extracts the path from either.
  private async signOrgDoc(
    client: any,
    stored: string | null,
  ): Promise<string | null> {
    if (!stored) return null;
    const path = storagePathFromStored(
      stored,
      OrganizationService.ORG_DOCS_BUCKET,
    );
    const { data } = await client.storage
      .from(OrganizationService.ORG_DOCS_BUCKET)
      .createSignedUrl(path, 60 * 60); // 1 hour, for the admin review session
    return data?.signedUrl ?? null;
  }

  // All organizations awaiting review, oldest first, with the fields an admin
  // needs to decide. KYC document links are returned as fresh signed URLs
  // (the bucket is private). Admin-only via AdminGuard; uses the service-role
  // client so RLS isn't in the way.
  async getPendingOrganizations() {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('organization_profiles')
      .select(
        'id, user_id, org_type, name, email, phone, registration_type, registration_number, ' +
          'representative_name, designation, website, parent_institution, coordinator_name, ' +
          'area_locality, intent_description, registration_certificate_url, pan_card_url, ' +
          'proof_document_url, created_at',
      )
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const organizations = await Promise.all(
      (data ?? []).map(async (org: any) => ({
        ...org,
        registration_certificate_url: await this.signOrgDoc(
          client,
          org.registration_certificate_url,
        ),
        pan_card_url: await this.signOrgDoc(client, org.pan_card_url),
        proof_document_url: await this.signOrgDoc(
          client,
          org.proof_document_url,
        ),
      })),
    );

    return { organizations };
  }

  // Approve or reject an organization from the admin panel. On approval it emails
  // the org and drops an in-app notification inline — this replaces the old DB
  // trigger + webhook + shared secret entirely (the caller here is an
  // authenticated admin, so no webhook auth is needed).
  async setApprovalStatus(orgId: string, status: 'approved' | 'rejected') {
    const client = this.supabase.getClient();

    const { data: org, error: fetchError } = await client
      .from('organization_profiles')
      .select(
        'id, user_id, name, email, registration_certificate_url, pan_card_url, proof_document_url',
      )
      .eq('id', orgId)
      .single();

    if (fetchError || !org)
      throw new NotFoundException('Organization not found');

    if (status === 'rejected') {
      // A rejected application is deleted outright. Reject only ever targets a
      // still-pending org (the admin panel lists only pending), which can't log
      // in yet and therefore has NO dependent data — no events, gallery,
      // reviews, endorsements. So we can safely remove everything tied to it:
      //   1. KYC documents from storage
      //   2. the organization_profiles row (must go before the auth user, since
      //      it FK-references auth.users)
      //   3. the auth user — frees the unique email for a fresh application and
      //      leaves no ghost account or PII behind.
      await removeFromStorage(client, OrganizationService.ORG_DOCS_BUCKET, [
        org.registration_certificate_url,
        org.pan_card_url,
        org.proof_document_url,
      ]);

      const { error: deleteError } = await client
        .from('organization_profiles')
        .delete()
        .eq('id', orgId);
      if (deleteError) throw new BadRequestException(deleteError.message);

      await client.auth.admin.deleteUser(org.user_id).catch(() => {});

      return {
        message: 'Organization rejected and removed',
        organization: { id: org.id, approval_status: 'rejected' },
      };
    }

    // Approved
    const { error: updateError } = await client
      .from('organization_profiles')
      .update({
        approval_status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (updateError) throw new BadRequestException(updateError.message);

    await Promise.all([
      this.email.sendOrgApprovedEmail(org.email, org.name).catch(() => {}),
      this.notifications.createNotification(
        org.user_id,
        org.user_id,
        'org_approved',
        'Your organization has been approved! You can now log in with your email.',
        org.id,
      ),
    ]);

    return {
      message: 'Organization approved',
      organization: { id: org.id, approval_status: 'approved' },
    };
  }

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

    if (error || !profile)
      throw new NotFoundException('Organization not found');

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
          .select('event_id, volunteer_id')
          .in('event_id', eventIds)
          .in('status', ['completed', 'checked_in'])
      : { data: [] };

    const eventsHosted = completedEvents?.length ?? 0;
    const volunteersEngaged = new Set(
      (attendedRegs || []).map((r: any) => r.volunteer_id),
    ).size;

    // Org man-hours = Σ over completed events of (per-person duration × attendees).
    // Single source: eventHours (overnight-aware, 2dp).
    let totalHours = 0;
    for (const ev of completedEvents || []) {
      const attendees = (attendedRegs || []).filter(
        (r: any) => r.event_id === ev.id,
      ).length;
      if (attendees > 0) {
        totalHours += eventHours(ev.start_time, ev.end_time) * attendees;
      }
    }

    return {
      profile: {
        ...profile,
        is_owner: isOwner,
        is_followed_by_current_user: isFollowedByCurrentUser,
        followers_count: followersCount ?? 0,
        total_hours_generated: Math.round(totalHours * 100) / 100,
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
      .select('id, title, status, event_date, location, registered_count')
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
      .select(
        `
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
      `,
      )
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
      .select('id, logo_url, cover_url')
      .eq('user_id', userId)
      .single();

    if (!existing) throw new NotFoundException('Profile not found');

    // org_type is admin/KYC-controlled, not user-editable. email has its own
    // dedicated endpoint (changeEmail) because it must stay in lockstep with
    // the Supabase Auth login email — silently accepting it here is how a
    // profile row and the login email used to drift apart (see changeEmail).
    // Dropped explicitly (not just omitted from the DTO) so a client can't
    // reintroduce the bug by posting the field directly — whitelist isn't on.
    const { org_type, email, ...updateData } = dto as any;

    // Re-apply here what the DTO's @Transform already did for validation —
    // transform:false on the global pipe means the handler receives the
    // original untrimmed body, not the instance validation actually ran
    // against. trimAllStrings covers every plain text field (name, phone,
    // tagline, ...) generically; website/linkedin/instagram additionally need
    // a protocol — used as raw <a href> targets on the public profile, they
    // resolve as broken relative links without one.
    trimAllStrings(updateData);
    if (updateData.website !== undefined)
      updateData.website = normalizeUrlField(updateData.website);
    if (updateData.linkedin !== undefined)
      updateData.linkedin = normalizeUrlField(updateData.linkedin);
    if (updateData.instagram !== undefined)
      updateData.instagram = normalizeUrlField(updateData.instagram);
    if (updateData.upi_id !== undefined)
      updateData.upi_id = normalizeTrimmedField(updateData.upi_id);
    if (updateData.team_members !== undefined)
      updateData.team_members = normalizeTeamMembers(updateData.team_members);
    if (updateData.achievements !== undefined)
      updateData.achievements = normalizeAchievements(updateData.achievements);

    const { data, error } = await client
      .from('organization_profiles')
      .update(updateData)
      .eq('id', existing.id)
      .select(PRIVATE_ORG_FIELDS)
      .single();

    const profile = data as OrgProfilePrivate | null;

    if (error || !profile)
      throw new BadRequestException(
        error?.message || 'Failed to update organization profile',
      );

    // Delete any logo/cover that was just replaced (new upload = fresh path, so
    // the old file would otherwise orphan). logo/cover share the profile-images
    // bucket with volunteer avatars.
    const replaced: (string | null | undefined)[] = [];
    if (
      updateData.logo_url &&
      existing.logo_url &&
      updateData.logo_url !== existing.logo_url
    )
      replaced.push(existing.logo_url);
    if (
      updateData.cover_url &&
      existing.cover_url &&
      updateData.cover_url !== existing.cover_url
    )
      replaced.push(existing.cover_url);
    await removeFromStorage(client, 'profile-images', replaced);
    return { profile };
  }

  // Dedicated, separate-from-updateProfile email change. Auth (auth.users) is
  // the source of truth for login — it's changed FIRST, and the profile row
  // is only touched if that succeeds, so the two can never disagree the way
  // a plain profile-table write would let them. If the profile write fails
  // after auth already changed, the auth email is rolled back rather than
  // left pointing somewhere the profile row doesn't corroborate.
  async changeEmail(userId: string, newEmailRaw: string) {
    const client = this.supabase.getClient();
    const newEmail = newEmailRaw.trim().toLowerCase();

    const { data: existing } = await client
      .from('organization_profiles')
      .select('id, email')
      .eq('user_id', userId)
      .single();

    if (!existing) throw new NotFoundException('Profile not found');
    if (existing.email.toLowerCase() === newEmail) {
      throw new BadRequestException('That is already your current email.');
    }

    const { error: authError } = await client.auth.admin.updateUserById(
      userId,
      {
        email: newEmail,
        email_confirm: true,
      },
    );

    if (authError) {
      const msg = authError.message || '';
      if (
        msg.toLowerCase().includes('already been registered') ||
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already exists')
      ) {
        throw new ConflictException(
          'That email is already in use by another account.',
        );
      }
      throw new BadRequestException(msg || 'Failed to change email');
    }

    const { data, error } = await client
      .from('organization_profiles')
      .update({ email: newEmail })
      .eq('id', existing.id)
      .select(PRIVATE_ORG_FIELDS)
      .single();

    const profile = data as OrgProfilePrivate | null;

    if (error || !profile) {
      // Auth already changed — revert it so login email and profile email
      // can't end up disagreeing, then surface a clear error.
      await client.auth.admin
        .updateUserById(userId, { email: existing.email, email_confirm: true })
        .catch(() => {});
      throw new BadRequestException(
        error?.message ||
          'Failed to update profile email — the change was reverted, please try again.',
      );
    }

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
      .select(
        `
      volunteer_id,
      status,
      volunteer_profiles (
        id, full_name, avatar_url, city, headline, total_hours
      ),
      events!inner (organization_id)
    `,
      )
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

    if (!volunteer)
      throw new ForbiddenException('Only volunteers can leave reviews');

    const { data, error } = await client
      .from('organization_reviews')
      .insert({ ...dto, volunteer_id: volunteer.id })
      .select(
        'id, organization_id, volunteer_id, event_id, rating, comment, created_at',
      )
      .single();

    if (error) throw error;
    return { review: data };
  }

  // ─────────────────────────────────────────────
  // ORG ACTION GALLERY
  // Requires: run backend/migrations/add_org_gallery.sql in Supabase first.
  // ─────────────────────────────────────────────

  /** GET /organizations/:id/gallery — public */
  async getOrgGallery(orgId: string) {
    const client = this.supabase.getClient();

    // orgId may be either the profile UUID or a user_id — resolve to profile id
    const { data: profile } = await client
      .from('organization_profiles')
      .select('id')
      .or(`id.eq.${orgId},user_id.eq.${orgId}`)
      .maybeSingle();

    const resolvedOrgId = profile?.id ?? orgId;

    const { data, error } = await client
      .from('org_gallery')
      .select('id, image_url, caption, created_at')
      .eq('org_id', resolvedOrgId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data;
  }

  /** POST /organizations/gallery — auth required, org only */
  async addToOrgGallery(
    userId: string,
    file: Express.Multer.File,
    caption?: string,
  ) {
    validateImageFile(file);
    const client = this.supabase.getClient();

    const { data: orgProfile, error: profileError } = await client
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !orgProfile)
      throw new ForbiddenException('Organization profile not found');

    const fileName = `org/${orgProfile.id}/${Date.now()}-${file.originalname}`;
    const { error: uploadError } = await client.storage
      .from('gallery_images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const {
      data: { publicUrl },
    } = client.storage.from('gallery_images').getPublicUrl(fileName);

    const { data, error } = await client
      .from('org_gallery')
      .insert({
        org_id: orgProfile.id,
        user_id: userId,
        image_url: publicUrl,
        caption,
      })
      .select('id, image_url, caption, created_at')
      .single();

    if (error) throw error;
    return data;
  }

  /** DELETE /organizations/gallery/:photoId — auth required, org owner only */
  async deleteFromOrgGallery(userId: string, photoId: string) {
    const client = this.supabase.getClient();

    // Grab the image URL before deleting the row so we can clean up the file.
    const { data: photo } = await client
      .from('org_gallery')
      .select('image_url')
      .eq('id', photoId)
      .eq('user_id', userId)
      .maybeSingle();

    const { error } = await client
      .from('org_gallery')
      .delete()
      .eq('id', photoId)
      .eq('user_id', userId);

    if (error) throw error;

    await removeFromStorage(client, 'gallery_images', [photo?.image_url]);
    return { success: true };
  }
}
