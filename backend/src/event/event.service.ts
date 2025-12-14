import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventService {
  constructor(private supabaseService: SupabaseService) {}

  async createEvent(userId: string, dto: CreateEventDto) {
    const supabase = this.supabaseService.getClient();

    // Get organization profile for this user
    const { data: orgProfile, error: orgError } = await supabase
      .from('organization_profiles')
      .select('id, approval_status')
      .eq('user_id', userId)
      .single();

    if (orgError || !orgProfile) {
      throw new NotFoundException('Organization profile not found');
    }

    // Check if organization is approved
    if (orgProfile.approval_status !== 'approved') {
      throw new ForbiddenException('Your organization must be approved before creating events');
    }

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        organization_id: orgProfile.id,
        title: dto.title,
        description: dto.description,
        cover_image_url: dto.coverImageUrl,
        category: dto.category,
        is_urgent: dto.isUrgent,
        event_date: dto.eventDate,
        start_time: dto.startTime,
        end_time: dto.endTime,
        location: dto.location,
        dress_code: dto.dressCode,
        things_to_bring: dto.thingsToBring,
        total_slots: dto.totalSlots,
        registration_deadline: dto.registrationDeadline,
        minimum_age: dto.minimumAge,
        status: 'published',
      })
      .select()
      .single();

    if (eventError) throw eventError;

    return {
      message: 'Event created successfully',
      event,
    };
  }

  async getOrganizationEvents(userId: string) {
    const supabase = this.supabaseService.getClient();

    // Get organization profile
    const { data: orgProfile, error: orgError } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (orgError || !orgProfile) {
      throw new NotFoundException('Organization profile not found');
    }

    // Get all events for this organization
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('organization_id', orgProfile.id)
      .order('created_at', { ascending: false });

    if (eventsError) throw eventsError;

    return { events };
  }

  async getPublicEvents() {
    const supabase = this.supabaseService.getClient();

    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        organization_profiles (
          name,
          org_type
        )
      `)
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true });

    if (error) throw error;

    return { events };
  }

  async getEventById(eventId: string, userId?: string) {
  const supabase = this.supabaseService.getClient();

  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      organization_profiles (
        name,
        org_type
      )
    `)
    .eq('id', eventId)
    .single();

  if (error) {
    throw new NotFoundException('Event not found');
  }

  // If userId provided, verify they own this event
  if (userId) {
    const { data: orgProfile } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (orgProfile && event.organization_id !== orgProfile.id) {
      throw new ForbiddenException('You do not have access to this event');
    }
  }

  return { event };
}
}