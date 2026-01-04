import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateVolunteerProfileDto } from './dto/update-volunteer-profile.dto';

@Injectable()
export class VolunteerService {
  constructor(private readonly supabase: SupabaseService) {}

  // Existing methods...
  async getProfile(userId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('volunteer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return { profile: data };
  }

  // NEW: Public profile with stats
  async getPublicProfile(volunteerId: string) {
    const client = this.supabase.getClient();

    // Get profile
    const { data: profile, error: profileError } = await client
      .from('volunteer_profiles')
      .select('*')
      .eq('id', volunteerId)
      .single();

    if (profileError) throw new NotFoundException('Profile not found');

    // Get registrations for reliability score
    const { data: registrations } = await client
      .from('event_registrations')
      .select('status')
      .eq('volunteer_id', volunteerId);

    const totalRegistered = registrations?.length || 0;
    const totalAttended = registrations?.filter(r => r.status === 'checked_in').length || 0;
    const reliabilityScore = totalRegistered > 0 
      ? Math.round((totalAttended / totalRegistered) * 100) 
      : 0;

    // Calculate badges
    const badges: string[] = [];
    if (profile.total_hours >= 50) badges.push('50+ Hours');
    if (profile.total_hours >= 100) badges.push('100+ Hours');
    if (totalAttended >= 5) badges.push('5 Events');
    if (totalAttended >= 10) badges.push('10 Events');
    if (reliabilityScore >= 90) badges.push('Reliable Volunteer');

    return {
      profile: {
        ...profile,
        reliability_score: reliabilityScore,
        events_attended: totalAttended,
        events_registered: totalRegistered,
        badges
      }
    };
  }

  // NEW: Journey with endorsements
  async getJourney(volunteerId: string) {
    const client = this.supabase.getClient();

    // Get all registrations with event and org details
    const { data: registrations, error } = await client
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
          organization_profiles (
            id,
            name,
            logo_url
          )
        )
      `)
      .eq('volunteer_id', volunteerId)
      .order('registered_at', { ascending: false });

    if (error) throw error;

    // Get endorsements
    const { data: endorsements } = await client
      .from('volunteer_endorsements')
      .select('*')
      .eq('volunteer_id', volunteerId);

    const journey = registrations?.map((reg: any) => {
      const event = reg.events;
      if (!event) return null;

      const endorsement = endorsements?.find(e => e.event_id === event.id);
      
      // Calculate hours
      const start = new Date(`1970-01-01T${event.start_time}`);
      const end = new Date(`1970-01-01T${event.end_time}`);
      const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));

      return {
        id: reg.id,
        event_title: event.title,
        event_date: event.event_date,
        organization_name: event.organization_profiles?.name,
        organization_logo: event.organization_profiles?.logo_url,
        hours_contributed: reg.status === 'checked_in' ? hours : 0,
        status: reg.status,
        endorsements: endorsement ? {
          skills: endorsement.skills,
          comment: endorsement.comment
        } : null
      };
    }).filter(Boolean) || [];

    return { journey };
  }

  // NEW: Update profile
  async updateProfile(userId: string, dto: UpdateVolunteerProfileDto) {
    const client = this.supabase.getClient();

    // Get profile ID
    const { data: profile } = await client
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!profile) throw new NotFoundException('Profile not found');

    // Update
    const { data, error } = await client
      .from('volunteer_profiles')
      .update({
        ...dto,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) throw error;

    return { profile: data };
  }

  // --- HISTORY (Your old code, fixed table name) ---
  async getVolunteerHistory(userId: string) {
    const client = this.supabase.getClient();

    const { data: profile } = await client
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) return { history: [] };

    // Fixed table: 'event_registrations' (not 'registrations')
    const { data: registrations, error } = await client
      .from('event_registrations') 
      .select(`
        id, status, checked_in_at,
        events (
          id, title, event_date, start_time, end_time, location, cover_image_url,
          organization_profiles (name)
        )
      `)
      .eq('volunteer_id', profile.id)
      .order('created_at', { ascending: false });

    if (error || !registrations) return { history: [] };

    const history = registrations
      .filter((reg: any) => reg.events)
      .map((reg: any) => {
        const event = reg.events;
        const isAttended = reg.status === 'checked_in' || reg.status === 'completed';
        const displayStatus = isAttended ? 'attended' : 'pending';

        return {
          id: event.id,
          title: event.title,
          date: event.event_date,
          image: event.cover_image_url,
          status: displayStatus,
          org: event.organization_profiles?.name || 'Organization',
          location: event.location,
          hasCertificate: isAttended,
        };
      });

    return { history };
  }
}