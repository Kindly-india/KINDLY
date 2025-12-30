import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventService {
  constructor(private supabaseService: SupabaseService) { }

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

  // --- REPLACED: This is the SMART version (Calculates Counts) ---
  async getOrganizationEvents(userId: string) {
    const supabase = this.supabaseService.getClient();

    // 1. Get organization profile
    const { data: orgProfile, error: orgError } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (orgError || !orgProfile) {
      throw new NotFoundException('Organization profile not found');
    }

    // 2. Get events WITH registrations (Joined Query)
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        event_registrations (
          id,
          status
        )
      `)
      .eq('organization_id', orgProfile.id)
      .order('created_at', { ascending: false });

    if (eventsError) throw eventsError;

    // 3. Calculate Counts (The "Smart" Part)
    const eventsWithCounts = events.map((event: any) => {
      const registrations = event.event_registrations || [];
      
      return {
        ...event,
        registered_count: registrations.length,
        checked_in_count: registrations.filter((r: any) => r.status === 'checked_in').length,
        event_registrations: undefined 
      };
    });

    return { events: eventsWithCounts };
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

  async getPublicEventById(eventId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: event, error } = await supabase
      .from('events')
      .select(`
      *,
      organization_profiles (
        name,
        org_type,
        email,
        phone
      )
    `)
      .eq('id', eventId)
      .eq('status', 'published')
      .single();

    if (error || !event) {
      throw new NotFoundException('Event not found');
    }

    return { event };
  }

  async registerForEvent(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    // Get volunteer profile
    const { data: volunteerProfile, error: profileError } = await supabase
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !volunteerProfile) {
      throw new NotFoundException('Volunteer profile not found');
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('status', 'published')
      .single();

    if (eventError || !event) {
      throw new NotFoundException('Event not found');
    }

    // Check if event is full
    if (event.registered_count >= event.total_slots) {
      throw new BadRequestException('Event is already full');
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('volunteer_id', volunteerProfile.id)
      .single();

    if (existing) {
      throw new BadRequestException('Already registered for this event');
    }

    // Register
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .insert({
        event_id: eventId,
        volunteer_id: volunteerProfile.id,
      })
      .select()
      .single();

    if (regError) throw regError;

    return {
      message: 'Successfully registered for event',
      registration,
    };
  }

  // Get event registrations with volunteer details
  async getEventRegistrations(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify the organization owns this event
    const { data: orgProfile, error: orgError } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (orgError || !orgProfile) {
      throw new NotFoundException('Organization profile not found');
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organization_id !== orgProfile.id) {
      throw new ForbiddenException('You do not have access to this event');
    }

    // Get all registrations with volunteer details
    const { data: registrations, error: regError } = await supabase
      .from('event_registrations')
      .select(`
        id,
        status,
        registered_at,
        checked_in_at,
        volunteer_profiles (
          id,
          full_name,
          phone,
          city,
          interests
        )
      `)
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });

    if (regError) throw regError;

    return { registrations };
  }

  // Check in a volunteer
  async checkInVolunteer(userId: string, eventId: string, registrationId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify the organization owns this event
    const { data: orgProfile, error: orgError } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (orgError || !orgProfile) {
      throw new NotFoundException('Organization profile not found');
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organization_id !== orgProfile.id) {
      throw new ForbiddenException('You do not have access to this event');
    }

    // Update registration status
    const { data: registration, error: updateError } = await supabase
      .from('event_registrations')
      .update({
        status: 'checked_in',
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', registrationId)
      .eq('event_id', eventId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      message: 'Volunteer checked in successfully',
      registration,
    };
  }

  // Undo check-in
  async undoCheckIn(userId: string, eventId: string, registrationId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify the organization owns this event
    const { data: orgProfile, error: orgError } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (orgError || !orgProfile) {
      throw new NotFoundException('Organization profile not found');
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organization_id !== orgProfile.id) {
      throw new ForbiddenException('You do not have access to this event');
    }

    // Update registration status
    const { data: registration, error: updateError } = await supabase
      .from('event_registrations')
      .update({
        status: 'registered',
        checked_in_at: null,
      })
      .eq('id', registrationId)
      .eq('event_id', eventId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      message: 'Check-in undone successfully',
      registration,
    };
  }

  // Cancel event
  async cancelEvent(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify the organization owns this event
    const { data: orgProfile, error: orgError } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (orgError || !orgProfile) {
      throw new NotFoundException('Organization profile not found');
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organization_id !== orgProfile.id) {
      throw new ForbiddenException('You do not have access to this event');
    }

    // Update event status to cancelled
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({ status: 'cancelled' })
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      message: 'Event cancelled successfully',
      event: updatedEvent,
    };
  }

  async updateEvent(userId: string, eventId: string, dto: CreateEventDto) {
    const supabase = this.supabaseService.getClient();

    // Verify the organization owns this event
    const { data: orgProfile, error: orgError } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (orgError || !orgProfile) {
      throw new NotFoundException('Organization profile not found');
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organization_id !== orgProfile.id) {
      throw new ForbiddenException('You do not have access to this event');
    }

    // Update event
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      message: 'Event updated successfully',
      event: updatedEvent,
    };
  }
  // Add this to EventService
  async getVolunteerRegistrations(userId: string) {
    const supabase = this.supabaseService.getClient();

    // 1. Get volunteer profile
    const { data: volProfile, error: volError } = await supabase
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (volError || !volProfile) {
      throw new NotFoundException('Volunteer profile not found');
    }

    // 2. Get registrations AND the related event details
    const { data: registrations, error: regError } = await supabase
      .from('event_registrations')
      .select(`
        id,
        status,
        registered_at,
        events (
          id,
          title,
          category,
          event_date,
          start_time,
          end_time,
          location,
          cover_image_url,
          total_slots,
          registered_count
        )
      `)
      .eq('volunteer_id', volProfile.id)
      .order('events(event_date)', { ascending: true }); // Show nearest events first

    if (regError) throw regError;

    // 3. Flatten the structure for easier frontend use
    const formattedEvents = registrations.map((reg: any) => ({
      ...reg.events, // Spread the event details
      registration_status: reg.status, // Keep track if they are registered or checked_in
      registration_id: reg.id
    }));

    return { events: formattedEvents };
  }

  // Add to EventService
  async getEventBroadcasts(eventId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data: broadcasts, error } = await supabase
      .from('event_broadcasts')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { broadcasts };
  }

  // Add inside EventService class

  async completeEvent(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    // 1. Verify ownership
    const { data: orgProfile } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!orgProfile) throw new NotFoundException('Organization not found');

    // 2. Update event status
    const { data: event, error } = await supabase
      .from('events')
      .update({ status: 'completed' })
      .eq('id', eventId)
      .eq('organization_id', orgProfile.id)
      .select()
      .single();

    if (error) throw error;

    return { message: 'Event marked as completed', event };
  }

  // src/events/events.service.ts

// src/events/events.service.ts

async getTopEvents() {
  const supabase = this.supabaseService.getClient();

  const { data: events, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      event_date,
      start_time,
      location,
      cover_image_url,
      registrations (count)
    `)
    .eq('status', 'published')
    //.gte('event_date', new Date().toISOString()) // Optional: Uncomment to only show future events
    .order('event_date', { ascending: true }) // Fallback sort
    .limit(20); // Fetch a batch to sort in memory

  if (error) {
    console.error('Error fetching top events:', error);
    return { events: [] };
  }

  // Sort by registration count (descending) and take top 4
  const topEvents = events
    .sort((a: any, b: any) => {
      const countA = a.registrations?.[0]?.count || 0;
      const countB = b.registrations?.[0]?.count || 0;
      return countB - countA;
    })
    .slice(0, 4);

  return { events: topEvents };
}
}