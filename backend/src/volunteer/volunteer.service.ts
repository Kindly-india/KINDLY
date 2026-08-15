import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { UpdateVolunteerProfileDto } from './dto/update-volunteer-profile.dto';
import { OnboardingDto } from './dto/onboarding.dto';
import { validateImageFile } from '../common/file-validation.util';
import { removeFromStorage } from '../common/storage.util';
import { eventHours } from '../common/hours.util';
import {
  normalizeUrlField,
  trimAllStrings,
} from '../common/text-normalize.util';

@Injectable()
export class VolunteerService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  // Reversible cut-off for an active volunteer (P2-19) — flips the flag +
  // logs it; JwtAuthGuard is what actually enforces it on every request.
  async setSuspension(
    volunteerId: string,
    suspended: boolean,
    reason: string | undefined,
    actorId: string,
    actorEmail: string | null,
  ) {
    const client = this.supabase.getClient();

    const { data: vol, error: fetchError } = await client
      .from('volunteer_profiles')
      .select('id, full_name, email')
      .eq('id', volunteerId)
      .single();

    if (fetchError || !vol)
      throw new NotFoundException('Volunteer not found');

    const { error: updateError } = await client
      .from('volunteer_profiles')
      .update({
        suspended_at: suspended ? new Date().toISOString() : null,
        suspended_reason: suspended ? (reason ?? null) : null,
        suspended_by: suspended ? actorId : null,
      })
      .eq('id', volunteerId);

    if (updateError) throw new BadRequestException(updateError.message);

    await this.audit.log(
      actorId,
      actorEmail,
      suspended ? 'volunteer.suspended' : 'volunteer.reactivated',
      'volunteer',
      volunteerId,
      { name: vol.full_name, email: vol.email, reason: reason ?? null },
    );

    return {
      message: suspended ? 'Volunteer suspended' : 'Volunteer reactivated',
      volunteer: { id: vol.id, suspended },
    };
  }

  // Admin detail view — full profile regardless of privacy setting or
  // follow status (unlike getProfileForViewer, which is privacy-gated),
  // plus suspension state, which no other endpoint exposes.
  async adminGetVolunteer(volunteerId: string) {
    const client = this.supabase.getClient();

    const { data: profile, error } = await client
      .from('volunteer_profiles')
      .select(
        'id, user_id, full_name, avatar_url, cover_url, headline, bio, city, address, email, phone, linkedin, instagram, website, skills, total_hours, is_verified, is_private, created_at, suspended_at, suspended_reason',
      )
      .eq('id', volunteerId)
      .single();

    if (error || !profile) throw new NotFoundException('Volunteer not found');

    return { volunteer: profile };
  }

  // Permanent delete (P1-16/P2-20) — restricted to superadmin via
  // SuperAdminGuard at the route. Unlike the org side, this cascade doesn't
  // threaten unrelated third parties — everything it touches (certificates,
  // registrations, payments, reviews they wrote, their own posts and the
  // comments/likes on those posts) is the volunteer's own account data, the
  // expected scope of "delete this account." So no certificate/payment
  // block here, just the typed-name confirmation.
  async hardDeleteVolunteer(
    volunteerId: string,
    confirmName: string,
    actorId: string,
    actorEmail: string | null,
  ) {
    const client = this.supabase.getClient();

    const { data: vol, error: fetchError } = await client
      .from('volunteer_profiles')
      .select('id, user_id, full_name, avatar_url, cover_url')
      .eq('id', volunteerId)
      .single();

    if (fetchError || !vol) throw new NotFoundException('Volunteer not found');

    if (confirmName !== vol.full_name) {
      throw new BadRequestException(
        'Typed name does not match the volunteer name',
      );
    }

    // volunteer_gallery isn't FK-linked to volunteer_profiles (confirmed via
    // live schema check) — its rows and files need explicit cleanup, the
    // row delete below won't cascade to them.
    const [{ data: galleryPhotos }, { data: posts }] = await Promise.all([
      client
        .from('volunteer_gallery')
        .select('id, image_url')
        .eq('user_id', vol.user_id),
      client.from('posts').select('photo_urls').eq('volunteer_id', vol.id),
    ]);

    await Promise.all([
      removeFromStorage(client, 'profile-images', [
        vol.avatar_url,
        vol.cover_url,
      ]),
      removeFromStorage(
        client,
        'gallery_images',
        (galleryPhotos ?? []).map((p) => p.image_url),
      ),
      removeFromStorage(
        client,
        'post-photos',
        (posts ?? []).flatMap((p) => p.photo_urls ?? []),
      ),
    ]);

    await client
      .from('volunteer_gallery')
      .delete()
      .eq('user_id', vol.user_id);

    // The row delete cascades certificates, event_registrations,
    // event_payments, organization_reviews, posts (+ their comments/likes),
    // and volunteer_endorsements — all the volunteer's own data.
    const { error: deleteError } = await client
      .from('volunteer_profiles')
      .delete()
      .eq('id', volunteerId);

    if (deleteError) throw new BadRequestException(deleteError.message);

    await client.auth.admin.deleteUser(vol.user_id).catch(() => {});

    await this.audit.log(
      actorId,
      actorEmail,
      'volunteer.deleted',
      'volunteer',
      volunteerId,
      { name: vol.full_name },
    );

    return { message: 'Volunteer permanently deleted' };
  }

  // Volunteers signed up via the OTP AuthCard have an auth user but no
  // volunteer_profiles row and no user_metadata.user_type. This backfills both,
  // idempotently, right after the user types their name — everything downstream
  // (getUserProfile, onboarding PATCH, my-registrations) assumes that row already exists.
  async ensureProfile(userId: string, fullName: string) {
    const client = this.supabase.getClient();

    const { data: existing } = await client
      .from('volunteer_profiles')
      .select('id, user_id, full_name, total_hours')
      .eq('user_id', userId)
      .maybeSingle();

    let profile = existing;

    if (!existing) {
      const { data: created, error } = await client
        .from('volunteer_profiles')
        .insert({
          user_id: userId,
          full_name: fullName,
          total_hours: 0,
        })
        .select('id, user_id, full_name, total_hours')
        .single();

      if (error) {
        throw new BadRequestException('Failed to create volunteer profile');
      }
      profile = created;
    }

    // ALWAYS ensure user_metadata.user_type is set — not just when we create the
    // row. A prior partial/failed signup (e.g. an interrupted Google flow) can
    // leave the row present but user_type unset, which permanently breaks
    // getUserProfile() and every role-gated surface (profile link, nav, routing).
    // We merge into existing metadata so Google's avatar/name aren't clobbered,
    // and only write when something actually needs changing.
    const { data: authData } = await client.auth.admin.getUserById(userId);
    const meta = authData?.user?.user_metadata ?? {};
    if (meta.user_type !== 'volunteer' || !meta.full_name) {
      await client.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...meta,
          user_type: 'volunteer',
          full_name: meta.full_name ?? fullName,
        },
      });
    }

    return { profile };
  }

  async getProfileForViewer(targetUserId: string, viewerId: string | null) {
    const client = this.supabase.getClient();

    // 1. Fetch Target Volunteer Profile (Robust Search: checks User ID first, then Profile ID)
    const profileColumns =
      'id, user_id, full_name, avatar_url, cover_url, headline, bio, city, address, email, phone, linkedin, instagram, website, skills, total_hours, is_verified, is_private, created_at';

    let { data: profile, error } = await client
      .from('volunteer_profiles')
      .select(profileColumns)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (error || !profile) {
      // Fallback: Try fetching by UUID if User ID failed
      const { data: profileById } = await client
        .from('volunteer_profiles')
        .select(profileColumns)
        .eq('id', targetUserId)
        .single();

      if (!profileById) {
        throw new NotFoundException('Profile not found');
      }
      profile = profileById;
    }

    // 2. Fetch Follow Stats (accepted only)
    const { count: followersCount } = await client
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.user_id)
      .eq('status', 'accepted');

    const { count: followingCount } = await client
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.user_id)
      .eq('status', 'accepted');

    // 3. Fetch Registrations (With Events Join for calculations)
    const { data: registrations } = await client
      .from('event_registrations')
      .select(
        `
        *,
        events (
          id,
          title,
          event_date,
          start_time,
          end_time,
          organization_id,
          status
        )
      `,
      )
      .eq('volunteer_id', profile.id);

    // --- CALCULATE METRICS ---
    // Exclude registrations for org-cancelled events from all scoring —
    // the volunteer should never be penalised for a cancellation outside their control.
    const scorableRegistrations = (registrations || []).filter(
      (r: any) => (r.events?.status ?? '') !== 'cancelled',
    );

    const totalRegistered = scorableRegistrations.length;

    // Filter for Verified Activity ('checked_in' or 'completed')
    const completedRegs = scorableRegistrations.filter((r) => {
      const status = (r.status || '').toLowerCase();
      return status === 'checked_in' || status === 'completed';
    });

    const totalAttended = completedRegs.length;

    // Authoritative total — the check-in trigger maintains volunteer_profiles.total_hours
    // as Σ eventHours over credited registrations. Read it directly (single source of
    // truth) rather than recomputing, so this profile always agrees with the landing
    // page, suggested-people, and org numbers. (Cancelled events can't hold credited
    // registrations, so the column already excludes them — see cancelEvent + check-in guard.)
    const totalHours = Number(profile.total_hours) || 0;

    // Initialize Graph (Last 6 Months)
    const activityGraph = Array(6)
      .fill(0)
      .map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return {
          name: d.toLocaleString('default', { month: 'short' }),
          hours: 0,
          monthIdx: d.getMonth(),
        };
      });

    // Build the 6-month activity graph from per-event hours (single source: eventHours).
    completedRegs.forEach((r) => {
      const reg = r;
      if (!reg.events) return;

      const hrs = eventHours(reg.events.start_time, reg.events.end_time);

      if (reg.events.event_date) {
        const d = new Date(reg.events.event_date);
        const entry = activityGraph.find((m) => m.monthIdx === d.getMonth());
        if (entry) entry.hours += hrs;
      }
    });
    // Kill floating-point noise from summing 2dp values.
    activityGraph.forEach((m) => {
      m.hours = Math.round(m.hours * 100) / 100;
    });

    // Impact Score: (Hours * 10) + (Events * 50)
    const impactScore = Math.round(totalHours * 10 + totalAttended * 50);

    // Reliability Score
    const reliabilityScore =
      totalRegistered > 0
        ? Math.round((totalAttended / totalRegistered) * 100)
        : 100;

    // Badges Logic
    const badges: string[] = [];
    if (totalHours >= 50) badges.push('Super Star');
    else if (totalHours >= 10) badges.push('Dedicated');

    if (totalAttended >= 5) badges.push('Veteran');
    else if (totalAttended >= 3) badges.push('Regular');

    if (impactScore >= 100) badges.push('Century Club');

    // --- CONSTRUCT COMMON DATA ---
    const commonData = {
      ...profile,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      total_hours: totalHours,
      events_attended: totalAttended,
      reliability_score: reliabilityScore,
      impact_score: impactScore,
      activity_graph: activityGraph,
      badges,
    };

    // --- VIEW PERMISSIONS LOGIC ---
    let viewType = 'public';
    let isAssociatedOrg = false;

    // Check if the Viewer is the Owner
    const isSelf = viewerId && profile.user_id === viewerId;

    if (isSelf) {
      viewType = 'private';
    } else if (viewerId) {
      // Check if Viewer is an Organization that has worked with this Volunteer
      const { data: viewerOrg } = await client
        .from('organization_profiles')
        .select('id')
        .eq('user_id', viewerId)
        .maybeSingle();

      if (viewerOrg) {
        const { data: link } = await client
          .from('event_registrations')
          .select('id, events!inner(organization_id)')
          .eq('volunteer_id', profile.id)
          .eq('events.organization_id', viewerOrg.id)
          .limit(1);
        if (link && link.length > 0) isAssociatedOrg = true;
      }
    }

    if (isAssociatedOrg) viewType = 'resume';

    // Check follow relationship — returned to the frontend to hydrate the Follow button
    let followStatus: 'none' | 'pending' | 'accepted' = 'none';
    if (viewerId && !isSelf) {
      const { data: followRecord } = await client
        .from('follows')
        .select('status')
        .eq('follower_id', viewerId)
        .eq('following_id', profile.user_id)
        .maybeSingle();
      followStatus = (followRecord?.status as 'pending' | 'accepted') ?? 'none';
    }

    // Mutual followers: people viewer follows who also follow the target
    let mutualFollowers: {
      count: number;
      preview: Array<{
        user_id: string;
        full_name: string;
        avatar_url: string | null;
      }>;
    } = { count: 0, preview: [] };
    if (viewerId && !isSelf) {
      const { data: viewerFollowing } = await client
        .from('follows')
        .select('following_id')
        .eq('follower_id', viewerId)
        .eq('status', 'accepted');
      const viewerFollowingIds = (viewerFollowing || []).map(
        (f: any) => f.following_id,
      );
      if (viewerFollowingIds.length > 0) {
        const { data: sharedFollowers } = await client
          .from('follows')
          .select('follower_id')
          .eq('following_id', profile.user_id)
          .eq('status', 'accepted')
          .in('follower_id', viewerFollowingIds);
        const mutualIds = (sharedFollowers || []).map(
          (f: any) => f.follower_id,
        );
        if (mutualIds.length > 0) {
          const { data: mutualProfiles } = await client
            .from('volunteer_profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', mutualIds)
            .limit(3);
          mutualFollowers = {
            count: mutualIds.length,
            preview: mutualProfiles || [],
          };
        }
      }
    }

    const showContactInfo =
      viewType === 'private' || viewType === 'resume' || isSelf;

    return {
      profile: {
        ...commonData,
        email: showContactInfo ? profile.email : null,
        phone: showContactInfo ? profile.phone : null,
        address: showContactInfo ? profile.address : null,
        view_type: viewType,
        follow_status: followStatus,
        mutual_followers: mutualFollowers,
      },
    };
  }

  // --- JOURNEY (Unchanged) ---
  async getJourney(volunteerId: string) {
    const client = this.supabase.getClient();
    const { data: profile } = await client
      .from('volunteer_profiles')
      .select('id')
      .or(`id.eq.${volunteerId},user_id.eq.${volunteerId}`)
      .single();
    if (!profile) throw new NotFoundException('Volunteer not found');

    const { data: registrations, error } = await client
      .from('event_registrations')
      .select(
        `id, status, events (id, title, event_date, start_time, end_time, organization_id, organization_profiles ( id, name, logo_url ))`,
      )
      .eq('volunteer_id', profile.id)
      .order('registered_at', { ascending: false });

    if (error) throw error;

    const { data: endorsements } = await client
      .from('volunteer_endorsements')
      .select('event_id, skills, comment')
      .eq('volunteer_id', profile.id);

    const journey =
      registrations
        ?.map((reg: any) => {
          const event = reg.events;
          if (!event) return null;
          const endorsement = endorsements?.find(
            (e) => e.event_id === event.id,
          );

          // Per-event credited hours (single source: eventHours). Only credited
          // statuses show hours; everything else shows 0.
          const hours = eventHours(event.start_time, event.end_time);

          return {
            id: reg.id,
            event_id: event.id,
            event_title: event.title,
            event_date: event.event_date,
            organization_name: event.organization_profiles?.name,
            organization_logo: event.organization_profiles?.logo_url,
            hours_contributed: ['checked_in', 'completed'].includes(reg.status)
              ? hours
              : 0,
            status: reg.status,
            endorsements: endorsement
              ? { skills: endorsement.skills, comment: endorsement.comment }
              : null,
          };
        })
        .filter(Boolean) || [];

    return { journey };
  }

  async updateProfile(userId: string, dto: UpdateVolunteerProfileDto) {
    const client = this.supabase.getClient();
    const { data: profile } = await client
      .from('volunteer_profiles')
      .select('id, avatar_url, cover_url')
      .eq('user_id', userId)
      .single();
    if (!profile) throw new NotFoundException('Profile not found');

    // email has its own dedicated endpoint (changeEmail) because it must stay
    // in lockstep with the Supabase Auth login email — dropped explicitly
    // (not just omitted from the DTO) so a client can't reintroduce the old
    // profile/auth email drift bug by posting the field directly.
    const { email, ...rest } = dto as any;

    // Re-apply here what the DTO's @Transform already did for validation —
    // see organization.service.ts's updateProfile for why (transform:false
    // on the global pipe). trimAllStrings covers every plain text field
    // (full_name, phone, city, ...) generically; website/linkedin/instagram
    // additionally need a protocol — used as raw <a href> targets on the
    // public profile, they resolve as broken relative links without one.
    trimAllStrings(rest);
    if (rest.website !== undefined)
      rest.website = normalizeUrlField(rest.website);
    if (rest.linkedin !== undefined)
      rest.linkedin = normalizeUrlField(rest.linkedin);
    if (rest.instagram !== undefined)
      rest.instagram = normalizeUrlField(rest.instagram);

    const { data, error } = await client
      .from('volunteer_profiles')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select(
        'id, user_id, full_name, headline, bio, city, address, phone, email, linkedin, instagram, website, skills, interest_tags, preferred_availability, avatar_url, cover_url, is_private, updated_at',
      )
      .single();
    if (error)
      throw new BadRequestException(
        error.message || 'Failed to update profile',
      );

    // Delete any image that was just replaced — the new upload has a fresh path,
    // so the old file would otherwise orphan in the bucket.
    const replaced: (string | null | undefined)[] = [];
    if (
      dto.avatar_url &&
      profile.avatar_url &&
      dto.avatar_url !== profile.avatar_url
    )
      replaced.push(profile.avatar_url);
    if (
      dto.cover_url &&
      profile.cover_url &&
      dto.cover_url !== profile.cover_url
    )
      replaced.push(profile.cover_url);
    await removeFromStorage(client, 'profile-images', replaced);

    return { profile: data };
  }

  // Dedicated, separate-from-updateProfile email change — mirrors
  // OrganizationService.changeEmail. Auth (auth.users) changes first; the
  // profile row is only touched if that succeeds, and is rolled back on a
  // profile-write failure so the two can never end up disagreeing.
  async changeEmail(userId: string, newEmailRaw: string) {
    const client = this.supabase.getClient();
    const newEmail = newEmailRaw.trim().toLowerCase();

    const { data: existing } = await client
      .from('volunteer_profiles')
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
      .from('volunteer_profiles')
      .update({ email: newEmail, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('id, user_id, email, updated_at')
      .single();

    if (error || !data) {
      await client.auth.admin
        .updateUserById(userId, { email: existing.email, email_confirm: true })
        .catch(() => {});
      throw new BadRequestException(
        error?.message ||
          'Failed to update profile email — the change was reverted, please try again.',
      );
    }

    return { profile: data };
  }

  async getGallery(userId: string) {
    const client = this.supabase.getClient();

    // Get user ID from profile ID if needed, similar to getProfile
    // For simplicity, assuming userId passed is the auth.user_id
    // You might need to resolve profile.id -> user_id if fetching by profile ID

    const { data, error } = await client
      .from('volunteer_gallery')
      .select('id, user_id, image_url, caption, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data;
  }

  // 2. Add Photo to Gallery
  async addToGallery(
    userId: string,
    file: Express.Multer.File,
    caption?: string,
  ) {
    validateImageFile(file);
    const client = this.supabase.getClient();

    // 1. Upload Image to Supabase Storage
    const fileName = `${userId}/${Date.now()}-${file.originalname}`;
    const { data: uploadData, error: uploadError } = await client.storage
      .from('gallery_images') // ✅ This MUST match the bucket name you created
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload Error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 2. Get Public URL
    const {
      data: { publicUrl },
    } = client.storage.from('gallery_images').getPublicUrl(fileName);

    // 3. Save metadata to the database
    const { data, error } = await client
      .from('volunteer_gallery')
      .insert({
        user_id: userId,
        image_url: publicUrl,
        caption: caption,
      })
      .select('id, user_id, image_url, caption, created_at')
      .single();

    if (error) throw error;
    return data;
  }

  async deleteFromGallery(userId: string, photoId: string) {
    const client = this.supabase.getClient();

    // Grab the image URL before deleting the row so we can clean up the file.
    const { data: photo } = await client
      .from('volunteer_gallery')
      .select('image_url')
      .eq('id', photoId)
      .eq('user_id', userId)
      .maybeSingle();

    // The RLS policy we created ensures users can only delete their OWN photos
    // but adding .eq('user_id', userId) is a good double-check
    const { error } = await client
      .from('volunteer_gallery')
      .delete()
      .eq('id', photoId)
      .eq('user_id', userId);

    if (error) throw error;

    await removeFromStorage(client, 'gallery_images', [photo?.image_url]);
    return { success: true };
  }

  async updateOnboarding(userId: string, dto: OnboardingDto) {
    const client = this.supabase.getClient();

    const { data, error } = await client
      .from('volunteer_profiles')
      .update({
        interest_tags: dto.interest_tags,
        preferred_availability: dto.preferred_availability,
        social_preference: dto.social_preference,
        onboarding_completed: true,
      })
      .eq('user_id', userId)
      .select(
        'id, user_id, interest_tags, preferred_availability, social_preference, onboarding_completed',
      )
      .single();

    if (error) throw error;
    return { profile: data };
  }

  async getPostableEvents(userId: string) {
    const client = this.supabase.getClient();

    const { data: profile } = await client
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!profile) return { events: [] };

    // Attended registrations with event data (exclude cancelled events)
    const { data: regs } = await client
      .from('event_registrations')
      .select(
        `
        event_id,
        events!inner(id, title, event_date, status, organization_profiles(name))
      `,
      )
      .eq('volunteer_id', profile.id)
      .in('status', ['checked_in', 'completed']);

    if (!regs?.length) return { events: [] };

    const validRegs = (regs as any[]).filter(
      (r) => r.events?.status !== 'cancelled',
    );
    if (!validRegs.length) return { events: [] };

    const eventIds = validRegs.map((r) => r.event_id);

    // Count posts per event for this volunteer
    const { data: posts } = await client
      .from('posts')
      .select('event_id')
      .eq('volunteer_id', profile.id)
      .in('event_id', eventIds);

    const postCountMap: Record<string, number> = {};
    for (const post of posts ?? []) {
      postCountMap[(post as any).event_id] =
        (postCountMap[(post as any).event_id] ?? 0) + 1;
    }

    const events = validRegs
      .map((r) => ({
        id: r.events.id,
        title: r.events.title,
        event_date: r.events.event_date,
        org_name: r.events.organization_profiles?.name ?? 'Unknown',
        post_count: postCountMap[r.event_id] ?? 0,
      }))
      .filter((e) => e.post_count < 3)
      .sort(
        (a, b) =>
          new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
      );

    return { events };
  }
}
