import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service'; 

@Injectable()
export class VolunteerService {
  constructor(private readonly supabase: SupabaseService) {}

  // Replace the method in src/volunteer/volunteer.service.ts
  async getVolunteerHistory(userId: string) {
    const client = this.supabase.getClient();

    // 1. Get Volunteer Profile ID
    const { data: profile } = await client
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid crash if profile missing

    if (!profile) {
      return { history: [] }; // Return empty list instead of throwing error
    }

    // 2. Fetch Registrations
    const { data: registrations, error } = await client
      .from('registrations')
      .select(`
        id,
        status,
        check_in_time,
        events (
          id,
          title,
          event_date,
          start_time,
          end_time,
          location,
          cover_image_url,
          organization_profiles (name)
        )
      `)
      .eq('volunteer_id', profile.id)
      .order('created_at', { ascending: false });

    if (error || !registrations) {
      return { history: [] }; // Return empty if error or null
    }

    // 3. Format Data
    const history = registrations
      .filter((reg: any) => reg.events) // Filter out any broken records
      .map((reg: any) => {
        const event = reg.events;
        const eventDate = new Date(event.event_date);
        const isAttended = reg.status === 'checked_in';
        const isPast = eventDate < new Date();

        let displayStatus = 'pending';
        if (isAttended) displayStatus = 'attended';
        else if (isPast) displayStatus = 'missed';

        let hours = 0;
        if (isAttended && event.start_time && event.end_time) {
           const start = parseInt(event.start_time.split(':')[0]);
           const end = parseInt(event.end_time.split(':')[0]);
           hours = Math.max(0, end - start);
        }

        return {
          id: event.id,
          title: event.title,
          date: eventDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          image: event.cover_image_url,
          status: displayStatus,
          hours: hours,
          org: event.organization_profiles?.name || 'Organization',
          location: event.location,
          hasCertificate: isAttended,
          gallery: []
        };
      });

    return { history };
    }
}