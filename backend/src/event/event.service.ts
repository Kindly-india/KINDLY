import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventService {
  constructor(private supabaseService: SupabaseService) { }

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
      .single(); // 🟢 REMOVED .eq('status', 'published')

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

    // 2. Fetch Registrations AND the 'certificates_issued' flag
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

    // 3. Format Response
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

  async updateEvent(userId: string, eventId: string, dto: CreateEventDto) {
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

    const eventDateTime = new Date(`${dto.eventDate}T${dto.startTime}:00+05:30`);
    const registrationDeadline = new Date(dto.registrationDeadline);
    const oneHourBefore = new Date(eventDateTime.getTime() - 60 * 60 * 1000);

    if (registrationDeadline >= eventDateTime) {
      throw new BadRequestException('Registration deadline must be before event start time');
    }
    if (registrationDeadline > oneHourBefore) {
      throw new BadRequestException('Registration deadline must be at least 1 hour before event start');
    }

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
        total_slots: dto.totalSlots,
        registration_deadline: dto.registrationDeadline,
        minimum_age: dto.minimumAge,
        status: 'published',
      })
      .select()
      .single();

    if (eventError) throw eventError;

    return { message: 'Event created successfully', event };
  }

  async registerForEvent(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: volunteerProfile, error: profileError } = await supabase
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !volunteerProfile) {
      throw new NotFoundException('Volunteer profile not found');
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('status', 'published')
      .single();

    if (eventError || !event) {
      throw new NotFoundException('Event not found');
    }

    if (new Date(event.registration_deadline) < new Date()) {
      throw new BadRequestException('Registration deadline has passed');
    }

    if (event.registered_count >= event.total_slots) {
      throw new BadRequestException('Event is already full');
    }

    const { data: existing } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('volunteer_id', volunteerProfile.id)
      .single();

    if (existing) {
      throw new BadRequestException('Already registered for this event');
    }

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

  // ✅ NEW: Send Broadcast Logic
  async sendBroadcast(userId: string, eventId: string, message: string) {
    // Cast to 'any' to bypass missing type definition for event_broadcasts
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

  // ✅ NEW: Get Broadcasts Logic (Fixed duplicate)
  async getEventBroadcasts(eventId: string) {
    // Cast to 'any' to bypass missing type definition for event_broadcasts
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

  // ✅ NEW: Recent Activity Logic
  async getRecentActivity(userId: string) {
    const supabase = this.supabaseService.getClient();

    // 1. Get Org ID
    const { data: orgProfile } = await supabase.from('organization_profiles').select('id').eq('user_id', userId).single();
    if (!orgProfile) throw new NotFoundException('Organization not found');

    // 2. Fetch recent events created by Org (Limit 5)
    const { data: events } = await supabase
      .from('events')
      .select('title, created_at')
      .eq('organization_id', orgProfile.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // 3. Fetch recent registrations for Org's events (Limit 10 to ensure coverage)
    // We join events to filter by org_id
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

    // 4. Process & Merge Data
    const activities: any[] = [];

    // Add "Published" activities
    events?.forEach((ev: any) => {
      activities.push({
        id: `pub-${ev.created_at}`,
        type: 'publish',
        text: `You published '${ev.title}'.`,
        timestamp: new Date(ev.created_at),
      });
    });

    // Add "Registered" & "Checked In" activities
    registrations?.forEach((reg: any) => {
      const volName = reg.volunteer_profiles?.full_name || 'A volunteer';
      const eventTitle = reg.events?.title || 'an event';

      // Always add registration
      activities.push({
        id: `reg-${reg.registered_at}`,
        type: 'register',
        text: `${volName} registered for ${eventTitle}.`,
        timestamp: new Date(reg.registered_at),
      });

      // If checked in, add check-in activity
      if (reg.checked_in_at) {
        activities.push({
          id: `chk-${reg.checked_in_at}`,
          type: 'checkin',
          text: `${volName} checked in at ${eventTitle}.`,
          timestamp: new Date(reg.checked_in_at),
        });
      }
    });

    // 5. Sort by newest first and limit to 5
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return { activities: activities.slice(0, 5) };
  }

  // ✅ NEW: Upload Signature Logic
  async uploadOrgSignature(userId: string, file: Express.Multer.File) {
    const supabase = this.supabaseService.getClient();
    
    // 1. Get Org Profile
    const { data: orgProfile } = await supabase.from('organization_profiles').select('id').eq('user_id', userId).single();
    if (!orgProfile) throw new NotFoundException('Organization not found');

    // 2. Upload to Supabase Storage
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${orgProfile.id}-${Date.now()}.${fileExt}`;
    const filePath = `signatures/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('org-signatures')
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (uploadError) throw new BadRequestException('Failed to upload signature');

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage.from('org-signatures').getPublicUrl(filePath);

    // 4. Save URL to Profile
    const { error: dbError } = await supabase
      .from('organization_profiles')
      .update({ signature_url: publicUrl })
      .eq('id', orgProfile.id);

    if (dbError) throw dbError;

    return { message: 'Signature uploaded successfully', signatureUrl: publicUrl };
  }

  // ✅ NEW: Issue Certificates Logic
  async issueCertificates(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    // 1. Verify Org
    const { data: orgProfile } = await supabase.from('organization_profiles').select('id, signature_url').eq('user_id', userId).single();
    if (!orgProfile) throw new NotFoundException('Organization not found');

    // 2. Check if Signature exists
    if (!orgProfile.signature_url) {
        throw new BadRequestException('You must upload your organization signature/stamp before issuing certificates.');
    }

    // 3. Verify Event Ownership & Completion
    const { data: event } = await supabase.from('events').select('status').eq('id', eventId).eq('organization_id', orgProfile.id).single();
    if (!event) throw new ForbiddenException('Event not found or access denied');
    if (event.status !== 'completed') throw new BadRequestException('Event must be marked as completed before issuing certificates.');

    // 4. Update Event Flag
    const { error } = await supabase
      .from('events')
      .update({ certificates_issued: true })
      .eq('id', eventId);

    if (error) throw error;

    return { message: 'Certificates issued successfully' };
  }
}