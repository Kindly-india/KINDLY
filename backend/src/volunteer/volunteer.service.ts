import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service'; 

@Injectable()
export class VolunteerService {
  constructor(private readonly supabase: SupabaseService) {}

  // --- CRITICAL: This is needed to show "Hello Manas" ---
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

  // --- Profile Creation (Needed for new users) ---
  async createProfile(userId: string, dto: any) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('volunteer_profiles')
      .insert({ ...dto, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return { message: 'Profile created', profile: data };
  }

  // --- Profile Update ---
  async updateProfile(userId: string, dto: any) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('volunteer_profiles')
      .update(dto)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { message: 'Profile updated', profile: data };
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