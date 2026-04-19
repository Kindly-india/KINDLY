import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateVolunteerProfileDto } from './dto/update-volunteer-profile.dto';
import { OnboardingDto } from './dto/onboarding.dto';
import { validateImageFile } from '../common/file-validation.util';

@Injectable()
export class VolunteerService {
  constructor(private readonly supabase: SupabaseService) {}

  async getProfileForViewer(targetUserId: string, viewerId: string | null) {
    const client = this.supabase.getClient();

    // 1. Fetch Target Volunteer Profile (Robust Search: checks User ID first, then Profile ID)
    let { data: profile, error } = await client
      .from('volunteer_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle(); 

    if (error || !profile) {
       // Fallback: Try fetching by UUID if User ID failed
       const { data: profileById } = await client
        .from('volunteer_profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();
        
       if(!profileById) {
           throw new NotFoundException('Profile not found');
       }
       profile = profileById;
    }

    // 2. Fetch Follow Stats (accepted only)
    const { count: followersCount } = await client
      .from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.user_id).eq('status', 'accepted');

    const { count: followingCount } = await client
      .from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.user_id).eq('status', 'accepted');

    // 3. Fetch Registrations (With Events Join for calculations)
    const { data: registrations } = await client
      .from('event_registrations')
      .select(`
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
      `)
      .eq('volunteer_id', profile.id);

    // --- CALCULATE METRICS ---
    // Exclude registrations for org-cancelled events from all scoring —
    // the volunteer should never be penalised for a cancellation outside their control.
    const scorableRegistrations = (registrations || []).filter(
      (r: any) => (r.events?.status ?? '') !== 'cancelled'
    );

    const totalRegistered = scorableRegistrations.length;

    // Filter for Verified Activity ('checked_in' or 'completed')
    const completedRegs = scorableRegistrations.filter(r => {
        const status = (r.status || '').toLowerCase();
        return status === 'checked_in' || status === 'completed';
    });

    const totalAttended = completedRegs.length;
    let totalHours = 0;
    
    // Initialize Graph (Last 6 Months)
    const activityGraph = Array(6).fill(0).map((_, i) => {
       const d = new Date();
       d.setMonth(d.getMonth() - (5 - i));
       return { 
           name: d.toLocaleString('default', { month: 'short' }), 
           hours: 0, 
           monthIdx: d.getMonth() 
       };
    });

    completedRegs.forEach(r => {
        const reg = r as any; 
        if (!reg.events) return;

        // 1. Determine Hours (Smart Calc)
        let hrs = reg.hours_contributed || 0;
        
        // If DB hours are 0, use start/end time difference
        if (!hrs && reg.events.start_time && reg.events.end_time) {
            const [sh, sm] = reg.events.start_time.split(':').map(Number);
            const [eh, em] = reg.events.end_time.split(':').map(Number);
            hrs = Math.max(0, (eh * 60 + em) - (sh * 60 + sm)) / 60;
        }
        
        totalHours += hrs;

        // 2. Add to Graph
        if (reg.events.event_date) {
            const d = new Date(reg.events.event_date);
            const entry = activityGraph.find(m => m.monthIdx === d.getMonth());
            if (entry) entry.hours += hrs;
        }
    });

    // Impact Score: (Hours * 10) + (Events * 50)
    const impactScore = Math.round((totalHours * 10) + (totalAttended * 50));

    // Reliability Score
    const reliabilityScore = totalRegistered > 0 
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
      total_hours: Math.round(totalHours * 10) / 10,
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
    let mutualFollowers: { count: number; preview: Array<{ user_id: string; full_name: string; avatar_url: string | null }> } = { count: 0, preview: [] };
    if (viewerId && !isSelf) {
      const { data: viewerFollowing } = await client
        .from('follows')
        .select('following_id')
        .eq('follower_id', viewerId)
        .eq('status', 'accepted');
      const viewerFollowingIds = (viewerFollowing || []).map((f: any) => f.following_id);
      if (viewerFollowingIds.length > 0) {
        const { data: sharedFollowers } = await client
          .from('follows')
          .select('follower_id')
          .eq('following_id', profile.user_id)
          .eq('status', 'accepted')
          .in('follower_id', viewerFollowingIds);
        const mutualIds = (sharedFollowers || []).map((f: any) => f.follower_id);
        if (mutualIds.length > 0) {
          const { data: mutualProfiles } = await client
            .from('volunteer_profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', mutualIds)
            .limit(3);
          mutualFollowers = { count: mutualIds.length, preview: mutualProfiles || [] };
        }
      }
    }

    const showContactInfo = viewType === 'private' || viewType === 'resume' || isSelf;

    return {
      profile: {
        ...commonData,
        email: showContactInfo ? profile.email : null,
        phone: showContactInfo ? profile.phone : null,
        address: showContactInfo ? profile.address : null,
        view_type: viewType,
        follow_status: followStatus,
        mutual_followers: mutualFollowers,
      }
    };
  }

  // --- JOURNEY (Unchanged) ---
  async getJourney(volunteerId: string) {
    const client = this.supabase.getClient();
    const { data: profile } = await client.from('volunteer_profiles').select('id').or(`id.eq.${volunteerId},user_id.eq.${volunteerId}`).single();
    if (!profile) throw new NotFoundException('Volunteer not found');

    const { data: registrations, error } = await client
      .from('event_registrations')
      .select(`*, events (id, title, event_date, start_time, end_time, organization_id, organization_profiles ( id, name, logo_url ))`)
      .eq('volunteer_id', profile.id)
      .order('registered_at', { ascending: false });

    if (error) throw error;

    const { data: endorsements } = await client.from('volunteer_endorsements').select('*').eq('volunteer_id', profile.id);

    const journey = registrations?.map((reg: any) => {
      const event = reg.events;
      if (!event) return null;
      const endorsement = endorsements?.find(e => e.event_id === event.id);
      
      let hours = reg.hours_contributed || 0;
      if (!hours && event.start_time && event.end_time) {
          const start = new Date(`1970-01-01T${event.start_time}`);
          const end = new Date(`1970-01-01T${event.end_time}`);
          hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
      }

      return {
        id: reg.id,
        event_title: event.title,
        event_date: event.event_date,
        organization_name: event.organization_profiles?.name,
        organization_logo: event.organization_profiles?.logo_url,
        hours_contributed: ['checked_in', 'completed'].includes(reg.status) ? Math.round(hours*10)/10 : 0,
        status: reg.status,
        endorsements: endorsement ? { skills: endorsement.skills, comment: endorsement.comment } : null
      };
    }).filter(Boolean) || [];

    return { journey };
  }

  // --- UPDATE PROFILE (Unchanged) ---
  async updateProfile(userId: string, dto: UpdateVolunteerProfileDto) {
    const client = this.supabase.getClient();
    const { data: profile } = await client.from('volunteer_profiles').select('id').eq('user_id', userId).single();
    if (!profile) throw new NotFoundException('Profile not found');
    const { data, error } = await client.from('volunteer_profiles').update({ ...dto, updated_at: new Date().toISOString() }).eq('id', profile.id).select().single();
    if (error) throw error;
    return { profile: data };
  }

  async getGallery(userId: string) {
    const client = this.supabase.getClient();
    
    // Get user ID from profile ID if needed, similar to getProfile
    // For simplicity, assuming userId passed is the auth.user_id
    // You might need to resolve profile.id -> user_id if fetching by profile ID
    
    const { data, error } = await client
      .from('volunteer_gallery')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data;
  }

  // 2. Add Photo to Gallery
  async addToGallery(userId: string, file: Express.Multer.File, caption?: string) {
    validateImageFile(file);
    const client = this.supabase.getClient();
    
    // 1. Upload Image to Supabase Storage
    const fileName = `${userId}/${Date.now()}-${file.originalname}`;
    const { data: uploadData, error: uploadError } = await client
      .storage
      .from('gallery_images') // ✅ This MUST match the bucket name you created
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error("Upload Error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = client
      .storage
      .from('gallery_images')
      .getPublicUrl(fileName);

    // 3. Save metadata to the database
    const { data, error } = await client
      .from('volunteer_gallery')
      .insert({
        user_id: userId,
        image_url: publicUrl,
        caption: caption
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteFromGallery(userId: string, photoId: string) {
    const client = this.supabase.getClient();

    // The RLS policy we created ensures users can only delete their OWN photos
    // but adding .eq('user_id', userId) is a good double-check
    const { error } = await client
      .from('volunteer_gallery')
      .delete()
      .eq('id', photoId)
      .eq('user_id', userId);

    if (error) throw error;
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
      .select()
      .single();

    if (error) throw error;
    return { profile: data };
  }
}