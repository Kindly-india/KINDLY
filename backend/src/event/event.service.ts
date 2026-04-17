import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventService {
  constructor(private supabaseService: SupabaseService) { }

  async uploadEventImage(userId: string, file: Express.Multer.File) {
    const supabase = this.supabaseService.getClient();

    // 1. Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `gallery/${fileName}`;

    // 2. Upload to 'event-images' bucket (CORRECTED NAME)
    const { error: uploadError } = await supabase.storage
      .from('event-images') // 👈 UPDATED HERE
      .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) {
      throw new BadRequestException('Failed to upload image: ' + uploadError.message);
    }

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('event-images') // 👈 UPDATED HERE
      .getPublicUrl(filePath);
    console.log('Public URL:', publicUrl);
    return publicUrl;
  }

async updateEvent(userId: string, eventId: string, dto: CreateEventDto) {
    const supabase = this.supabaseService.getClient();

    // 1. Verify Organization
    const { data: orgProfile, error: orgError } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (orgError || !orgProfile) {
      throw new NotFoundException('Organization profile not found');
    }

    // 2. Verify Event Ownership
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

    // 3. Validate Deadlines (Only if dates are provided)
    if (dto.eventDate && dto.startTime && dto.registrationDeadline) {
      const eventDateTime = new Date(`${dto.eventDate}T${dto.startTime}:00+05:30`);
      const registrationDeadline = new Date(dto.registrationDeadline);
      const oneHourBefore = new Date(eventDateTime.getTime() - 60 * 60 * 1000);

      if (registrationDeadline >= eventDateTime) {
        throw new BadRequestException('Registration deadline must be before event start time');
      }
      if (registrationDeadline > oneHourBefore) {
        throw new BadRequestException('Registration deadline must be at least 1 hour before event start');
      }
    }

    // 4. Prepare Update Object
    const updateData: any = {
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
      // --- NEW CLUB FIELDS ---
      point_of_contact: dto.pointOfContact,
      connect_plan: dto.connectPlan,
      // -----------------------
      total_slots: dto.totalSlots,
      registration_deadline: dto.registrationDeadline,
      minimum_age: dto.minimumAge,
      updated_at: new Date().toISOString(),
    };

    // ✅ Map galleryImages (DTO) to gallery_images (DB)
    if ((dto as any).galleryImages) {
      updateData.gallery_images = (dto as any).galleryImages;
    }

    // 5. Execute Update
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      message: 'Event updated successfully',
      event: updatedEvent,
    };
  }

  // ==========================================
  // EXISTING METHODS (Unchanged)
  // ==========================================

  async getOrganizationEvents(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: orgProfile, error: orgError } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (orgError || !orgProfile) {
      throw new NotFoundException('Organization profile not found');
    }

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

  async getPublicEvents(userId?: string) {
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

    // Feed personalization: if user is logged in and has interest_tags, sort relevant events first
    if (userId && events) {
      const { data: profile } = await supabase
        .from('volunteer_profiles')
        .select('interest_tags')
        .eq('user_id', userId)
        .maybeSingle();

      const interestTags: string[] = profile?.interest_tags || [];

      if (interestTags.length > 0) {
        // Map interest tags to parent event categories
        const TAG_TO_CATEGORY: Record<string, string> = {
          treks_cleanups: 'nature_outdoors', tree_plantation: 'nature_outdoors',
          water_cleanup: 'nature_outdoors', wildlife: 'nature_outdoors', urban_gardening: 'nature_outdoors',
          food_drives: 'food_hunger',
          donation_drives: 'donation_drives',
          elderly_care: 'elderly_care',
          women_safety: 'women_empowerment',
          slum_upliftment: 'civic_community', rallies_awareness: 'civic_community',
          teaching: 'education_mentoring', kids_art: 'education_mentoring',
          kids_sports: 'education_mentoring', storytelling: 'education_mentoring',
          career_guidance: 'education_mentoring',
          dog_feeding: 'animal_welfare', animal_shelter: 'animal_welfare',
          adoption_drives: 'animal_welfare', cat_care: 'animal_welfare', bird_rescue: 'animal_welfare',
          art_culture: 'art_culture',
          health_camps: 'health_medical',
          marathons_sports: 'youth_sports',
          mental_health: 'mental_wellness',
        };

        const preferredCategories = new Set(
          interestTags.map(tag => TAG_TO_CATEGORY[tag]).filter(Boolean)
        );

        const relevant = events.filter(e => preferredCategories.has(e.category));
        const rest = events.filter(e => !preferredCategories.has(e.category));
        return { events: [...relevant, ...rest] };
      }
    }

    return { events };
  }

  async getTopEvents() {
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
      .order('registered_count', { ascending: false })
      .limit(4);

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
      .single();

    if (error || !event) {
      throw new NotFoundException('Event not found');
    }

    return { event };
  }

  async getEventRegistrations(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

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

  async getVolunteerRegistrations(userId: string) {
    const supabase = this.supabaseService.getClient();

    // 1. Get Volunteer Profile
    const { data: volProfile, error: volError } = await supabase
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (volError || !volProfile) throw new NotFoundException('Volunteer profile not found');

    // 2. Fetch Registrations
    const { data: registrations, error: regError } = await supabase.from('event_registrations')
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
          status, 
          certificates_issued,  
          organization_profiles(name)
        )
      `)
      .eq('volunteer_id', volProfile.id)
      .order('events(event_date)', { ascending: true });

    if (regError) throw regError;

    const formattedEvents = registrations.map((reg: any) => ({
      ...reg.events,
      registration_status: reg.status,
      registration_id: reg.id
    }));

    return { events: formattedEvents };
  }

  async checkInVolunteer(userId: string, eventId: string, registrationId: string) {
    const supabase = this.supabaseService.getClient();

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
      .select('organization_id, event_date, start_time')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organization_id !== orgProfile.id) {
      throw new ForbiddenException('You do not have access to this event');
    }

    const eventStart = new Date(`${event.event_date}T${event.start_time}:00+05:30`);
    if (new Date() < eventStart) {
      throw new BadRequestException('Cannot check in volunteers before the event has started');
    }

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

  async selfCheckIn(userId: string, data: { eventId: string; code: string; latitude: number; longitude: number }) {
    const supabase = this.supabaseService.getClient();

    const { data: volProfile } = await supabase
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!volProfile) throw new NotFoundException('Volunteer profile not found');

    const { data: event } = await supabase
      .from('events')
      .select('id, latitude, longitude, check_in_code, event_date, start_time')
      .eq('id', data.eventId)
      .single();

    if (!event) throw new NotFoundException('Event not found');

    if (event.check_in_code !== data.code) {
      throw new BadRequestException('Invalid QR Code. Please scan the official event code.');
    }

    const eventStart = new Date(`${event.event_date}T${event.start_time}:00+05:30`);
    if (new Date() < eventStart) {
      throw new BadRequestException('Check-in not open yet. Please wait for event start.');
    }

    if (event.latitude && event.longitude) {
      const distance = this.calculateDistance(
        event.latitude,
        event.longitude,
        data.latitude,
        data.longitude
      );

      if (distance > 0.2) {
        throw new BadRequestException(`You are too far from the venue (${(distance * 1000).toFixed(0)}m away). Please get closer.`);
      }
    }

    const { error } = await supabase
      .from('event_registrations')
      .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
      .eq('event_id', data.eventId)
      .eq('volunteer_id', volProfile.id);

    if (error) throw new BadRequestException('Failed to check in. Are you registered?');

    return { message: 'Checked in successfully' };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async undoCheckIn(userId: string, eventId: string, registrationId: string) {
    const supabase = this.supabaseService.getClient();

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

  async cancelEvent(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

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

  async completeEvent(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: orgProfile } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!orgProfile) throw new NotFoundException('Organization not found');

    const { data: eventData, error: fetchError } = await supabase
      .from('events')
      .select('event_date, start_time')
      .eq('id', eventId)
      .eq('organization_id', orgProfile.id)
      .single();

    if (fetchError || !eventData) throw new NotFoundException('Event not found');

    const eventStart = new Date(`${eventData.event_date}T${eventData.start_time}:00+05:30`);
    if (new Date() < eventStart) {
      throw new BadRequestException('Cannot mark event as completed before it has started');
    }

    const { data: event, error } = await supabase
      .from('events')
      .update({ status: 'completed' })
      .eq('id', eventId)
      .eq('organization_id', orgProfile.id)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('event_registrations')
      .update({ status: 'completed' })
      .eq('event_id', eventId)
      .eq('status', 'checked_in');

    await supabase
      .from('event_registrations')
      .update({ status: 'missed' })
      .eq('event_id', eventId)
      .eq('status', 'registered');

    return { message: 'Event marked as completed', event };
  }

  async createEvent(userId: string, dto: CreateEventDto) {
    const supabase = this.supabaseService.getClient();

    const { data: orgProfile, error: orgError } = await supabase
      .from('organization_profiles')
      .select('id, approval_status')
      .eq('user_id', userId)
      .single();

    if (orgError || !orgProfile) {
      throw new NotFoundException('Organization profile not found');
    }

    if (orgProfile.approval_status !== 'approved') {
      throw new ForbiddenException('Your organization must be approved before creating events');
    }

    const eventDateTime = new Date(`${dto.eventDate}T${dto.startTime}:00+05:30`);
    const registrationDeadline = new Date(dto.registrationDeadline);

    const oneHourBefore = new Date(eventDateTime.getTime() - 60 * 60 * 1000);

    if (registrationDeadline < new Date()) {
      throw new BadRequestException('Registration deadline cannot be in the past');
    }

    if (registrationDeadline >= eventDateTime) {
      throw new BadRequestException('Registration deadline must be before event start time');
    }

    if (registrationDeadline > oneHourBefore) {
      throw new BadRequestException('Registration deadline must be at least 1 hour before event start');
    }

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
        // --- NEW CLUB FIELDS ---
        point_of_contact: dto.pointOfContact,
        connect_plan: dto.connectPlan,
        // -----------------------
        total_slots: dto.totalSlots,
        registration_deadline: dto.registrationDeadline,
        minimum_age: dto.minimumAge,
        status: 'pending', // <--- CHANGED FROM 'published' TO 'pending'
      })
      .select()
      .single();

    if (eventError) throw eventError;

    return { message: 'Event created successfully', event };
  }

  async registerForEvent(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.rpc('register_for_event', {
      p_user_id: userId,
      p_event_id: eventId,
    });

    if (error) {
      const msg = error.message;
      if (msg.includes('VOLUNTEER_NOT_FOUND')) throw new NotFoundException('Volunteer profile not found');
      if (msg.includes('EVENT_NOT_FOUND')) throw new NotFoundException('Event not found');
      if (msg.includes('DEADLINE_PASSED')) throw new BadRequestException('Registration deadline has passed');
      if (msg.includes('EVENT_FULL')) throw new BadRequestException('Event is already full');
      if (msg.includes('ALREADY_REGISTERED')) throw new BadRequestException('Already registered for this event');
      throw error;
    }

    return {
      message: 'Successfully registered for event',
      registration: data,
    };
  }

  async sendBroadcast(userId: string, eventId: string, message: string) {
    const supabase = this.supabaseService.getClient() as any;

    const { data: orgProfile } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!orgProfile) throw new NotFoundException('Organization not found');

    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organization_id', orgProfile.id)
      .single();

    if (!event) throw new ForbiddenException('You can only broadcast to your own events');

    const { data, error } = await supabase
      .from('event_broadcasts')
      .insert({
        event_id: eventId,
        organization_id: orgProfile.id,
        message: message,
        is_important: true
      })
      .select()
      .single();

    if (error) throw error;
    return { message: 'Broadcast sent successfully', broadcast: data };
  }

  async getEventBroadcasts(eventId: string) {
    const supabase = this.supabaseService.getClient() as any;

    const { data: broadcasts, error } = await supabase
      .from('event_broadcasts')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { broadcasts };
  }

  async deleteBroadcast(userId: string, eventId: string, broadcastId: string) {
    const supabase = this.supabaseService.getClient() as any;
    const { data: orgProfile } = await supabase.from('organization_profiles').select('id').eq('user_id', userId).single();
    if (!orgProfile) throw new NotFoundException('Organization not found');

    const { error } = await supabase.from('event_broadcasts').delete().eq('id', broadcastId).eq('organization_id', orgProfile.id);
    if (error) throw error;
    return { message: 'Broadcast deleted successfully' };
  }

  async getRecentActivity(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: orgProfile } = await supabase.from('organization_profiles').select('id').eq('user_id', userId).single();
    if (!orgProfile) throw new NotFoundException('Organization not found');

    const { data: events } = await supabase
      .from('events')
      .select('title, created_at')
      .eq('organization_id', orgProfile.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: registrations } = await supabase
      .from('event_registrations')
      .select(`
        status, 
        registered_at, 
        checked_in_at,
        volunteer_profiles(full_name),
        events!inner(title, organization_id) 
      `)
      .eq('events.organization_id', orgProfile.id)
      .order('registered_at', { ascending: false })
      .limit(10);

    const activities: any[] = [];

    events?.forEach((ev: any) => {
      activities.push({
        id: `pub-${ev.created_at}`,
        type: 'publish',
        text: `You published '${ev.title}'.`,
        timestamp: new Date(ev.created_at),
      });
    });

    registrations?.forEach((reg: any) => {
      const volName = reg.volunteer_profiles?.full_name || 'A volunteer';
      const eventTitle = reg.events?.title || 'an event';

      activities.push({
        id: `reg-${reg.registered_at}`,
        type: 'register',
        text: `${volName} registered for ${eventTitle}.`,
        timestamp: new Date(reg.registered_at),
      });

      if (reg.checked_in_at) {
        activities.push({
          id: `chk-${reg.checked_in_at}`,
          type: 'checkin',
          text: `${volName} checked in at ${eventTitle}.`,
          timestamp: new Date(reg.checked_in_at),
        });
      }
    });

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return { activities: activities.slice(0, 5) };
  }

  async uploadOrgSignature(userId: string, file: Express.Multer.File) {
    const supabase = this.supabaseService.getClient();

    const { data: orgProfile } = await supabase.from('organization_profiles').select('id').eq('user_id', userId).single();
    if (!orgProfile) throw new NotFoundException('Organization not found');

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${orgProfile.id}-${Date.now()}.${fileExt}`;
    const filePath = `signatures/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('org-signatures')
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (uploadError) throw new BadRequestException('Failed to upload signature');

    const { data: { publicUrl } } = supabase.storage.from('org-signatures').getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from('organization_profiles')
      .update({ signature_url: publicUrl })
      .eq('id', orgProfile.id);

    if (dbError) throw dbError;

    return { message: 'Signature uploaded successfully', signatureUrl: publicUrl };
  }

  async issueCertificates(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: orgProfile } = await supabase.from('organization_profiles').select('id, signature_url').eq('user_id', userId).single();
    if (!orgProfile) throw new NotFoundException('Organization not found');

    if (!orgProfile.signature_url) {
      throw new BadRequestException('You must upload your organization signature/stamp before issuing certificates.');
    }

    const { data: event } = await supabase.from('events').select('status').eq('id', eventId).eq('organization_id', orgProfile.id).single();
    if (!event) throw new ForbiddenException('Event not found or access denied');
    if (event.status !== 'completed') throw new BadRequestException('Event must be marked as completed before issuing certificates.');

    const { error } = await supabase
      .from('events')
      .update({ certificates_issued: true })
      .eq('id', eventId);

    if (error) throw error;

    return { message: 'Certificates issued successfully' };
  }

  // In EventService class

  async submitReview(userId: string, eventId: string, rating: number, comment: string) {
    const supabase = this.supabaseService.getClient();

    // 1. Get Volunteer Profile
    const { data: volProfile } = await supabase
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!volProfile) throw new NotFoundException('Volunteer profile not found');

    // 2. Get Event & Organization Details
    const { data: event } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single();

    if (!event) throw new NotFoundException('Event not found');

    // 3. Check if review already exists (Optional, prevents duplicates)
    const { data: existing } = await supabase
      .from('org_reviews')
      .select('id')
      .eq('event_id', eventId)
      .eq('volunteer_id', volProfile.id)
      .single();

    if (existing) throw new BadRequestException('You have already reviewed this event');

    // 4. Insert Review
    const { error } = await supabase
      .from('org_reviews')
      .insert({
        organization_id: event.organization_id,
        volunteer_id: volProfile.id,
        event_id: eventId,
        rating: rating,
        comment: comment
      });

    if (error) throw new BadRequestException('Failed to submit review: ' + error.message);

    return { message: 'Review submitted successfully' };
  }

  // Add this method
  async getVolunteerReview(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: volProfile } = await supabase
      .from('volunteer_profiles').select('id').eq('user_id', userId).single();

    if (!volProfile) return null;

    const { data: review } = await supabase
      .from('org_reviews')
      .select('*')
      .eq('event_id', eventId)
      .eq('volunteer_id', volProfile.id)
      .single();

    return { review };
  }

  // --- ADMIN GOD MODE APIs ---

  // Get all pending events
  async getPendingEvents() {
    const supabase = this.supabaseService.getClient();

    const { data: events, error } = await supabase
      .from('events')
      .select(`
      *,
      organization_profiles (
        name,
        email,
        phone
      )
    `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { events };
  }

  // Admin route to forcefully approve and edit an event
  async adminApproveEvent(eventId: string, updateData: Partial<CreateEventDto>) {
    const supabase = this.supabaseService.getClient();

    // Map the incoming DTO back to the database format
    const dbUpdateData: any = {
      status: 'published', // Force status to published
      title: updateData.title,
      description: updateData.description,
      category: updateData.category,
      event_date: updateData.eventDate,
      start_time: updateData.startTime,
      end_time: updateData.endTime,
      location: updateData.location,
      point_of_contact: updateData.pointOfContact,
      connect_plan: updateData.connectPlan, // You can override this here
      // ... we map the rest of the fields we care about tweaking
      updated_at: new Date().toISOString(),
    };

    // Remove undefined fields so we don't accidentally wipe data
    Object.keys(dbUpdateData).forEach(key => {
      if (dbUpdateData[key] === undefined) {
        delete dbUpdateData[key];
      }
    });

    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update(dbUpdateData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;

    return { message: 'Event approved and published!', event: updatedEvent };
  }
}