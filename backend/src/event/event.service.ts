import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from '../email/email.service';
import { PaymentsService } from '../payments/payments.service';
import { AuditService } from '../audit/audit.service';
import { CreateEventDto } from './dto/create-event.dto';
import { AdminCreateEventDto } from './dto/admin-create-event.dto';
import { validateImageFile } from '../common/file-validation.util';
import { removeFromStorage } from '../common/storage.util';
import { eventHours } from '../common/hours.util';

const GEOLOCK_RADIUS_METERS = 200;

// City/district-level types are too coarse for geo-lock (would be km off)
const COARSE_TYPES = new Set([
  'locality',
  'sublocality',
  'sublocality_level_1',
  'administrative_area_level_1',
  'administrative_area_level_2',
  'administrative_area_level_3',
  'country',
  'postal_code',
  'political',
]);

// Ola Maps' forward Geocode API — swapped in for Nominatim/OSM (same rationale
// as searchPlaces/reverseGeocodePoint below): now that the create-event picker
// sets coordinates directly, this only fires when an organizer types/edits a
// location without using autocomplete/GPS/the map pin, so it should stay
// consistent with the rest of the location stack rather than falling back to OSM.
async function geocodeLocation(
  location: string,
): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.OLA_MAPS_API_KEY;
  if (!apiKey) {
    console.warn(
      '[Geo] OLA_MAPS_API_KEY not configured — skipping geocode fallback',
    );
    return null;
  }
  const parts = location
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const query = parts.slice(i).join(', ');
    try {
      const url = `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(query)}&api_key=${apiKey}`;
      console.log(`[Geo] Trying: "${query}"`);
      const res = await fetch(url);
      if (!res.ok) continue;
      const data: any = await res.json();
      const results: any[] = data.geocodingResults || data.results || [];
      if (results.length > 0) {
        const result = results[0];
        const type = result.types?.[0] || '';
        if (COARSE_TYPES.has(type)) {
          console.log(
            `[Geo] Skipping coarse result (type="${type}") for: "${query}"`,
          );
          continue;
        }
        const loc = result.geometry?.location;
        if (loc?.lat != null && loc?.lng != null) {
          console.log(
            `[Geo] Using result type="${type}" lat=${loc.lat} lng=${loc.lng}`,
          );
          return { lat: loc.lat, lng: loc.lng };
        }
      }
    } catch (err) {
      console.error(`[Geo] Error on attempt ${i + 1}:`, err);
    }
  }
  console.warn(
    '[Geo] No precise geocoding result for:',
    location,
    '— org must use GPS button',
  );
  return null;
}

export interface LocationSuggestion {
  label: string;
  lat: number;
  lng: number;
}

// Ola Maps' Places Autocomplete — swapped in for Photon/OSM (frontend) because
// OSM's POI database has real coverage gaps for tier-2 Indian cities like
// Nashik. Response shape mirrors Google's legacy Places Autocomplete API.
async function searchPlaces(
  query: string,
  lat: number,
  lng: number,
): Promise<LocationSuggestion[]> {
  const apiKey = process.env.OLA_MAPS_API_KEY;
  if (!apiKey)
    throw new BadRequestException('Location search is not configured');

  const url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query)}&location=${lat},${lng}&api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new BadRequestException('Location search failed');

  const data: any = await res.json();
  const predictions: any[] = data.predictions || [];
  return predictions
    .map((p) => ({
      label: p.description,
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
    }))
    .filter((s) => s.lat != null && s.lng != null);
}

// Ola Maps' Reverse Geocoding — same rationale as searchPlaces above.
async function reverseGeocodePoint(
  lat: number,
  lng: number,
): Promise<string | null> {
  const apiKey = process.env.OLA_MAPS_API_KEY;
  if (!apiKey)
    throw new BadRequestException('Location search is not configured');

  const url = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lng}&api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new BadRequestException('Reverse geocoding failed');

  const data: any = await res.json();
  return data.results?.[0]?.formatted_address ?? null;
}

@Injectable()
export class EventService {
  constructor(
    private supabaseService: SupabaseService,
    private emailService: EmailService,
    private paymentsService: PaymentsService,
    private auditService: AuditService,
  ) {}

  async searchLocations(
    query: string,
    lat: number,
    lng: number,
  ): Promise<LocationSuggestion[]> {
    return searchPlaces(query, lat, lng);
  }

  async reverseGeocodeLocation(
    lat: number,
    lng: number,
  ): Promise<{ label: string | null }> {
    return { label: await reverseGeocodePoint(lat, lng) };
  }

  async uploadEventImage(userId: string, file: Express.Multer.File) {
    validateImageFile(file);
    const supabase = this.supabaseService.getClient();

    // 1. Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `gallery/${fileName}`;

    // 2. Upload to 'event-images' bucket (CORRECTED NAME)
    const { error: uploadError } = await supabase.storage
      .from('event-images') // 👈 UPDATED HERE
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new BadRequestException(
        'Failed to upload image: ' + uploadError.message,
      );
    }

    // 3. Get Public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from('event-images') // 👈 UPDATED HERE
      .getPublicUrl(filePath);
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
      .select('organization_id, cover_image_url, gallery_images, ticket_price')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organization_id !== orgProfile.id) {
      throw new ForbiddenException('You do not have access to this event');
    }

    // Ticket price can only be set/changed while the event has zero paid
    // registrations. Changing it (or reverting to free) after money has
    // already changed hands would corrupt the bill calculation and confuse
    // volunteers who already paid.
    const requestedTicketPrice = dto.ticketPrice ?? null;
    if (requestedTicketPrice !== (event.ticket_price ?? null)) {
      const { count: paidCount } = await supabase
        .from('event_payments')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'paid');

      if (paidCount && paidCount > 0) {
        throw new BadRequestException(
          'Ticket price cannot be changed once volunteers have paid for this event',
        );
      }
    }

    // 3. Validate Deadlines (Only if dates are provided)
    if (dto.eventDate && dto.startTime && dto.registrationDeadline) {
      const eventDateTime = new Date(
        `${dto.eventDate}T${dto.startTime}:00+05:30`,
      );
      const registrationDeadline = new Date(dto.registrationDeadline);
      const oneHourBefore = new Date(eventDateTime.getTime() - 60 * 60 * 1000);

      if (registrationDeadline >= eventDateTime) {
        throw new BadRequestException(
          'Registration deadline must be before event start time',
        );
      }
      if (registrationDeadline > oneHourBefore) {
        throw new BadRequestException(
          'Registration deadline must be at least 1 hour before event start',
        );
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
      total_slots: dto.totalSlots ?? null,
      registration_deadline: dto.registrationDeadline,
      minimum_age: dto.minimumAge,
      ticket_price: requestedTicketPrice,
      updated_at: new Date().toISOString(),
    };

    // ✅ Map galleryImages (DTO) to gallery_images (DB)
    if ((dto as any).galleryImages) {
      updateData.gallery_images = (dto as any).galleryImages;
    }

    // Geocode if coords not provided
    if ((dto.latitude == null || dto.longitude == null) && dto.location) {
      const coords = await geocodeLocation(dto.location);
      updateData.latitude = coords?.lat ?? null;
      updateData.longitude = coords?.lng ?? null;
    } else {
      updateData.latitude = dto.latitude ?? null;
      updateData.longitude = dto.longitude ?? null;
    }

    // 5. Execute Update
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select(
        'id, organization_id, title, description, cover_image_url, gallery_images, category, is_urgent, event_date, start_time, end_time, location, latitude, longitude, dress_code, things_to_bring, point_of_contact, connect_plan, total_slots, registered_count, registration_deadline, minimum_age, ticket_price, status, certificates_issued, updated_at, created_at',
      )
      .single();

    if (updateError) throw updateError;

    // Clean up storage now that the row-level change is committed: an old
    // cover that got replaced, and any gallery images dropped from the array.
    if (
      dto.coverImageUrl &&
      event.cover_image_url &&
      event.cover_image_url !== dto.coverImageUrl
    ) {
      await removeFromStorage(supabase, 'event-images', [
        event.cover_image_url,
      ]);
    }
    if (updateData.gallery_images) {
      const oldGallery: string[] = event.gallery_images ?? [];
      const newGallery: string[] = updateData.gallery_images;
      const removedImages = oldGallery.filter(
        (url) => !newGallery.includes(url),
      );
      if (removedImages.length > 0) {
        await removeFromStorage(supabase, 'event-images', removedImages);
      }
    }

    return {
      message: 'Event updated successfully',
      event: updatedEvent,
    };
  }

  async updateEventGallery(
    userId: string,
    eventId: string,
    galleryImages: string[],
  ) {
    const supabase = this.supabaseService.getClient();

    const { data: orgProfile } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!orgProfile) throw new ForbiddenException('Organization not found');

    const { data: event } = await supabase
      .from('events')
      .select('organization_id, gallery_images')
      .eq('id', eventId)
      .maybeSingle();

    if (!event) throw new NotFoundException('Event not found');
    if (event.organization_id !== orgProfile.id)
      throw new ForbiddenException('You do not have access to this event');

    const { data: updated, error } = await supabase
      .from('events')
      .update({ gallery_images: galleryImages })
      .eq('id', eventId)
      .select('gallery_images')
      .single();

    if (error) throw error;

    // Clean up any images dropped from the array (best-effort, mirrors updateEvent).
    const oldGallery: string[] = event.gallery_images ?? [];
    const removedImages = oldGallery.filter(
      (url) => !galleryImages.includes(url),
    );
    if (removedImages.length > 0) {
      await removeFromStorage(supabase, 'event-images', removedImages);
    }

    return { gallery_images: updated.gallery_images };
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
      .select(
        `
        *,
        event_registrations (
          id,
          status
        )
      `,
      )
      .eq('organization_id', orgProfile.id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (eventsError) throw eventsError;

    const eventsWithCounts = events.map((event: any) => {
      const registrations = event.event_registrations || [];

      return {
        ...event,
        registered_count: registrations.length,
        checked_in_count: registrations.filter(
          (r: any) => r.status === 'checked_in' || r.status === 'completed',
        ).length,
        event_registrations: undefined,
      };
    });

    return { events: eventsWithCounts };
  }

  async getPublicEvents(userId?: string, location?: string) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('events')
      .select(
        `
        id, title, description, category, cover_image_url, is_urgent,
        event_date, start_time, end_time, location,
        total_slots, registered_count, registration_deadline, connect_plan,
        organization_profiles ( name, org_type )
      `,
      )
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(50);

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    const { data: events, error } = await query;

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
          treks_cleanups: 'nature_outdoors',
          tree_plantation: 'nature_outdoors',
          water_cleanup: 'nature_outdoors',
          wildlife: 'nature_outdoors',
          urban_gardening: 'nature_outdoors',
          food_drives: 'food_hunger',
          donation_drives: 'donation_drives',
          elderly_care: 'elderly_care',
          women_safety: 'women_empowerment',
          slum_upliftment: 'civic_community',
          rallies_awareness: 'civic_community',
          teaching: 'education_mentoring',
          kids_art: 'education_mentoring',
          kids_sports: 'education_mentoring',
          storytelling: 'education_mentoring',
          career_guidance: 'education_mentoring',
          dog_feeding: 'animal_welfare',
          animal_shelter: 'animal_welfare',
          adoption_drives: 'animal_welfare',
          cat_care: 'animal_welfare',
          bird_rescue: 'animal_welfare',
          art_culture: 'art_culture',
          health_camps: 'health_medical',
          marathons_sports: 'youth_sports',
          mental_health: 'mental_wellness',
        };

        const preferredCategories = new Set(
          interestTags.map((tag) => TAG_TO_CATEGORY[tag]).filter(Boolean),
        );

        const relevant = events.filter((e) =>
          preferredCategories.has(e.category),
        );
        const rest = events.filter((e) => !preferredCategories.has(e.category));
        return { events: [...relevant, ...rest] };
      }
    }

    return { events };
  }

  async getCompletedEvents() {
    const supabase = this.supabaseService.getClient();

    const { data: events, error } = await supabase
      .from('events')
      .select(
        `
        id, title, cover_image_url,
        event_date, start_time, end_time, location,
        organization_id,
        organization_profiles ( name, logo_url ),
        event_registrations ( id, status )
      `,
      )
      .eq('status', 'completed')
      .order('event_date', { ascending: false })
      .limit(50);

    if (error) throw error;

    return {
      events: (events || []).map((ev: any) => {
        const regs: any[] = ev.event_registrations || [];
        const attendeeCount = regs.filter(
          (r) => r.status === 'checked_in' || r.status === 'completed',
        ).length;

        // Event man-hours = per-person duration × attendees (single source: eventHours)
        const totalHours =
          Math.round(
            eventHours(ev.start_time, ev.end_time) * attendeeCount * 100,
          ) / 100;

        return {
          id: ev.id,
          title: ev.title,
          cover_image_url: ev.cover_image_url ?? null,
          event_date: ev.event_date,
          location: ev.location,
          org_name: ev.organization_profiles?.name ?? null,
          org_logo_url: ev.organization_profiles?.logo_url ?? null,
          org_id: ev.organization_id,
          attendee_count: attendeeCount,
          total_hours: totalHours,
        };
      }),
    };
  }

  async getTopEvents() {
    const supabase = this.supabaseService.getClient();

    const { data: events, error } = await supabase
      .from('events')
      .select(
        `
        id, title, category, cover_image_url, is_urgent,
        event_date, start_time, end_time, location,
        total_slots, registered_count, registration_deadline, connect_plan,
        organization_profiles ( name, org_type )
      `,
      )
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
      .select(
        `
      *,
      organization_profiles (
        name,
        org_type
      )
    `,
      )
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
      .select(
        `
      *,
      organization_profiles (
        name,
        logo_url,
        org_type,
        email,
        phone,
        is_verified
      )
    `,
      )
      .eq('id', eventId)
      .single();

    if (error || !event) {
      throw new NotFoundException('Event not found');
    }

    return { event };
  }

  async getShowcaseData(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: volProfile } = await supabase
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!volProfile)
      throw new ForbiddenException('You did not attend this event');

    const { data: reg } = await supabase
      .from('event_registrations')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('volunteer_id', volProfile.id)
      .in('status', ['checked_in', 'completed'])
      .maybeSingle();

    if (!reg) throw new ForbiddenException('You did not attend this event');

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`*, organization_profiles (name, logo_url, org_type)`)
      .eq('id', eventId)
      .single();

    if (eventError || !event) throw new NotFoundException('Event not found');

    const { data: rawCert } = await supabase
      .from('certificates')
      .select('id, verification_id, issued_at, hours_credited, event_id')
      .eq('event_id', eventId)
      .eq('volunteer_id', volProfile.id)
      .maybeSingle();

    const certificate = rawCert
      ? {
          ...rawCert,
          event_title: event.title,
          event_date: event.event_date,
          org_name: event.organization_profiles?.name,
        }
      : null;

    const { data: review } = await supabase
      .from('organization_reviews')
      .select('rating, comment')
      .eq('event_id', eventId)
      .eq('volunteer_id', volProfile.id)
      .maybeSingle();

    return { event, registration: reg, certificate, review: review ?? null };
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
      .select(
        `
        id,
        status,
        registered_at,
        checked_in_at,
        volunteer_profiles (
          id,
          user_id,
          full_name,
          phone,
          city
        )
      `,
      )
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false })
      .limit(500);

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

    if (volError || !volProfile)
      throw new NotFoundException('Volunteer profile not found');

    // 2. Fetch Registrations
    const { data: registrations, error: regError } = await supabase
      .from('event_registrations')
      .select(
        `
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
      `,
      )
      .eq('volunteer_id', volProfile.id)
      .order('events(event_date)', { ascending: true })
      .limit(200);

    if (regError) throw regError;

    const formattedEvents = registrations.map((reg: any) => ({
      ...reg.events,
      registration_status: reg.status,
      registration_id: reg.id,
    }));

    return { events: formattedEvents };
  }

  async checkInVolunteer(
    userId: string,
    eventId: string,
    registrationId: string,
  ) {
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
      .select('organization_id, event_date, start_time, status')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organization_id !== orgProfile.id) {
      throw new ForbiddenException('You do not have access to this event');
    }

    const eventStart = new Date(
      `${event.event_date}T${event.start_time}+05:30`,
    );
    if (new Date() < eventStart) {
      throw new BadRequestException(
        'Cannot check in volunteers before the event has started',
      );
    }

    if (event.status === 'cancelled') {
      throw new BadRequestException(
        'Check-in is closed — this event was cancelled',
      );
    }

    if (event.status === 'completed') {
      throw new BadRequestException(
        'Check-in is closed — the event has been completed',
      );
    }

    const { data: registration, error: updateError } = await supabase
      .from('event_registrations')
      .update({
        status: 'checked_in',
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', registrationId)
      .eq('event_id', eventId)
      .select(
        'id, event_id, volunteer_id, status, registered_at, checked_in_at, payment_id',
      )
      .single();

    if (updateError) throw updateError;

    return {
      message: 'Volunteer checked in successfully',
      registration,
    };
  }

  async selfCheckIn(
    userId: string,
    data: { eventId: string; latitude: number; longitude: number },
  ) {
    const supabase = this.supabaseService.getClient();

    const { data: volProfile } = await supabase
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!volProfile) throw new NotFoundException('Volunteer profile not found');

    const { data: event } = await supabase
      .from('events')
      .select('id, latitude, longitude, event_date, start_time')
      .eq('id', data.eventId)
      .single();

    if (!event) throw new NotFoundException('Event not found');

    const eventStart = new Date(
      `${event.event_date}T${event.start_time}+05:30`,
    );
    if (new Date() < eventStart) {
      throw new BadRequestException(
        'Check-in not open yet. Please wait for event start.',
      );
    }

    if (!data.latitude || !data.longitude) {
      throw new BadRequestException(
        'Location access required for check-in. Enable location and try again.',
      );
    }

    if (!event.latitude || !event.longitude) {
      throw new BadRequestException(
        'Event location not configured. Contact organizer.',
      );
    }

    const distance = this.calculateDistance(
      event.latitude,
      event.longitude,
      data.latitude,
      data.longitude,
    );

    if (distance * 1000 > GEOLOCK_RADIUS_METERS) {
      throw new BadRequestException(
        `You must be within ${GEOLOCK_RADIUS_METERS}m of the event location to check in. You are ${(distance * 1000).toFixed(0)}m away.`,
      );
    }

    const { error } = await supabase
      .from('event_registrations')
      .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
      .eq('event_id', data.eventId)
      .eq('volunteer_id', volProfile.id);

    if (error)
      throw new BadRequestException('Failed to check in. Are you registered?');

    return { message: 'Checked in successfully' };
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
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
      .select('organization_id, status')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organization_id !== orgProfile.id) {
      throw new ForbiddenException('You do not have access to this event');
    }

    if (event.status === 'completed') {
      throw new BadRequestException(
        'Cannot undo check-in after the event has been completed',
      );
    }

    const { data: registration, error: updateError } = await supabase
      .from('event_registrations')
      .update({
        status: 'registered',
        checked_in_at: null,
      })
      .eq('id', registrationId)
      .eq('event_id', eventId)
      .select(
        'id, event_id, volunteer_id, status, registered_at, checked_in_at, payment_id',
      )
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
      .select(
        'organization_id, event_date, start_time, status, title, location',
      )
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organization_id !== orgProfile.id) {
      throw new ForbiddenException('You do not have access to this event');
    }

    if (event.status === 'cancelled') {
      throw new BadRequestException('This event has already been cancelled');
    }

    if (event.status === 'completed') {
      throw new BadRequestException('Cannot cancel a completed event');
    }

    // Time-lock: block cancellation within 2 hours of start time
    const eventStart = new Date(
      `${event.event_date}T${event.start_time}+05:30`,
    );
    const twoHoursBefore = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000);
    if (new Date() >= twoHoursBefore) {
      throw new BadRequestException(
        'Events cannot be cancelled within 2 hours of the start time. Contact support for emergency cancellations.',
      );
    }

    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({ status: 'cancelled' })
      .eq('id', eventId)
      .select('id, title, event_date, location, status')
      .single();

    if (updateError) throw updateError;

    // Best-effort 100% refund for every paid registration. Doesn't block or
    // fail the cancellation on individual refund failures — the org
    // cancelling already affects potentially many volunteers and is already
    // time-locked, so we don't want one stuck Razorpay refund to prevent the
    // whole cancellation. Failed refunds stay 'paid' (unrefunded) and surface
    // on the admin dashboard's refund-attention list for manual follow-up.
    const { failedCount } =
      await this.paymentsService.refundForEventCancellation(eventId);

    // Fire-and-forget — email every RSVP'd volunteer about the cancellation
    this.sendCancellationEmails(supabase, eventId, updatedEvent).catch(
      () => {},
    );

    // Fire-and-forget — alert admins about the cancellation
    const { data: orgData } = await supabase
      .from('organization_profiles')
      .select('name')
      .eq('id', orgProfile.id)
      .maybeSingle();

    this.emailService
      .sendAdminCancellationAlert(
        event.title ?? 'Untitled Event',
        orgData?.name ?? 'Unknown Org',
        event.event_date ?? '',
        event.location ?? '',
      )
      .catch(() => {});

    return {
      message: 'Event cancelled successfully',
      event: updatedEvent,
      ...(failedCount > 0 ? { refundFailures: failedCount } : {}),
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
      .select('event_date, start_time, status')
      .eq('id', eventId)
      .eq('organization_id', orgProfile.id)
      .single();

    if (fetchError || !eventData)
      throw new NotFoundException('Event not found');

    if (eventData.status === 'completed') {
      throw new BadRequestException(
        'This event has already been marked as completed',
      );
    }

    const eventStart = new Date(
      `${eventData.event_date}T${eventData.start_time}+05:30`,
    );
    if (new Date() < eventStart) {
      throw new BadRequestException(
        'Cannot mark event as completed before it has started',
      );
    }

    const { data: event, error } = await supabase
      .from('events')
      .update({ status: 'completed' })
      .eq('id', eventId)
      .eq('organization_id', orgProfile.id)
      .select('id, title, start_time, end_time, status')
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

    // The org's bill for this event (if any) is computed live by
    // PaymentsService when viewed, not generated here — see FINANCE.md's
    // Architecture section.

    // Fire-and-forget — email every checked-in volunteer that their hours are verified
    this.sendImpactEmails(supabase, eventId, event).catch(() => {});

    return { message: 'Event marked as completed', event };
  }

  // NOTE: event auto-completion now runs inside Postgres via pg_cron
  // (backend/migrations/auto_complete_events_cron.sql), not from this service.
  // The former autoCompleteEvents() method and its /events/auto-complete route
  // were removed along with the external cron.

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
      throw new ForbiddenException(
        'Your organization must be approved before creating events',
      );
    }

    const eventDateTime = new Date(
      `${dto.eventDate}T${dto.startTime}:00+05:30`,
    );
    const registrationDeadline = new Date(dto.registrationDeadline);

    const oneHourBefore = new Date(eventDateTime.getTime() - 60 * 60 * 1000);

    if (registrationDeadline < new Date()) {
      throw new BadRequestException(
        'Registration deadline cannot be in the past',
      );
    }

    if (registrationDeadline >= eventDateTime) {
      throw new BadRequestException(
        'Registration deadline must be before event start time',
      );
    }

    if (registrationDeadline > oneHourBefore) {
      throw new BadRequestException(
        'Registration deadline must be at least 1 hour before event start',
      );
    }

    const coords =
      (dto.latitude == null || dto.longitude == null) && dto.location
        ? await geocodeLocation(dto.location)
        : null;

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
        total_slots: dto.totalSlots ?? null,
        registration_deadline: dto.registrationDeadline,
        minimum_age: dto.minimumAge,
        latitude: coords?.lat ?? dto.latitude ?? null,
        longitude: coords?.lng ?? dto.longitude ?? null,
        ticket_price: dto.ticketPrice ?? null,
        status: 'pending', // <--- CHANGED FROM 'published' TO 'pending'
      })
      .select(
        'id, organization_id, title, status, event_date, start_time, location, created_at',
      )
      .single();

    if (eventError) throw eventError;

    return { message: 'Event created successfully', event };
  }

  // Admin creates an event directly on behalf of an org (picked by id, not
  // resolved from the caller's own profile — the caller is an admin, not the
  // org). Auto-published: an admin already carries approval authority, so
  // there's no point routing this through the pending->approve round-trip a
  // self-service org submission needs.
  async adminCreateEvent(
    dto: AdminCreateEventDto,
    actorId: string,
    actorEmail: string | null,
  ) {
    const supabase = this.supabaseService.getClient();

    const { data: orgProfile, error: orgError } = await supabase
      .from('organization_profiles')
      .select('id, approval_status')
      .eq('id', dto.organizationId)
      .single();

    if (orgError || !orgProfile) {
      throw new NotFoundException('Organization not found');
    }

    if (orgProfile.approval_status !== 'approved') {
      throw new ForbiddenException(
        'This organization must be approved before creating events',
      );
    }

    const eventDateTime = new Date(
      `${dto.eventDate}T${dto.startTime}:00+05:30`,
    );
    const registrationDeadline = new Date(dto.registrationDeadline);
    const oneHourBefore = new Date(eventDateTime.getTime() - 60 * 60 * 1000);

    if (registrationDeadline < new Date()) {
      throw new BadRequestException(
        'Registration deadline cannot be in the past',
      );
    }
    if (registrationDeadline >= eventDateTime) {
      throw new BadRequestException(
        'Registration deadline must be before event start time',
      );
    }
    if (registrationDeadline > oneHourBefore) {
      throw new BadRequestException(
        'Registration deadline must be at least 1 hour before event start',
      );
    }

    const coords =
      (dto.latitude == null || dto.longitude == null) && dto.location
        ? await geocodeLocation(dto.location)
        : null;

    const { data: event, error: eventError2 } = await supabase
      .from('events')
      .insert({
        organization_id: orgProfile.id,
        title: dto.title,
        description: dto.description,
        cover_image_url: dto.coverImageUrl,
        cover_focal_x: dto.coverFocalX ?? 50,
        cover_focal_y: dto.coverFocalY ?? 50,
        category: dto.category,
        is_urgent: dto.isUrgent,
        event_date: dto.eventDate,
        start_time: dto.startTime,
        end_time: dto.endTime,
        location: dto.location,
        dress_code: dto.dressCode,
        things_to_bring: dto.thingsToBring,
        point_of_contact: dto.pointOfContact,
        connect_plan: dto.connectPlan,
        total_slots: dto.totalSlots ?? null,
        registration_deadline: dto.registrationDeadline,
        minimum_age: dto.minimumAge,
        latitude: coords?.lat ?? dto.latitude ?? null,
        longitude: coords?.lng ?? dto.longitude ?? null,
        ticket_price: dto.ticketPrice ?? null,
        status: 'published',
      })
      .select(
        'id, organization_id, title, status, event_date, start_time, location, created_at',
      )
      .single();

    if (eventError2) throw eventError2;

    await this.auditService.log(
      actorId,
      actorEmail,
      'event.admin_created',
      'event',
      event.id,
      { organizationId: orgProfile.id, title: dto.title },
    );

    return { message: 'Event created and published', event };
  }

  async registerForEvent(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    // Paid events bypass register_for_event entirely — registration is only
    // created after payment confirms (see PaymentsService.createOrder /
    // confirm_paid_registration). This guard stops a paid event's "free"
    // registration route from being used to skip payment.
    const { data: eventForPriceCheck } = await supabase
      .from('events')
      .select('ticket_price')
      .eq('id', eventId)
      .maybeSingle();

    if (
      eventForPriceCheck?.ticket_price &&
      eventForPriceCheck.ticket_price > 0
    ) {
      throw new BadRequestException(
        'This is a paid event — use the payment flow to register (POST /events/:id/payment/order)',
      );
    }

    // Retry up to 3 times on transient advisory-lock contention.
    // Root cause: pg_advisory_lock (session-scoped) conflicts with PgBouncer
    // transaction-pooling mode. The SQL function should use pg_advisory_xact_lock
    // instead, but the retry here handles any residual contention gracefully.
    const MAX_ATTEMPTS = 3;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const { data, error } = await supabase.rpc('register_for_event', {
        p_user_id: userId,
        p_event_id: eventId,
      });

      if (!error) {
        // Fire-and-forget RSVP confirmation — fetch details then send
        this.sendRsvpEmail(supabase, userId, eventId).catch(() => {});
        return {
          message: 'Successfully registered for event',
          registration: data,
        };
      }

      const msg = error.message ?? '';

      // Non-retryable business errors — surface immediately
      if (msg.includes('VOLUNTEER_NOT_FOUND'))
        throw new NotFoundException('Volunteer profile not found');
      if (msg.includes('EVENT_NOT_FOUND'))
        throw new NotFoundException('Event not found');
      if (msg.includes('DEADLINE_PASSED'))
        throw new BadRequestException('Registration deadline has passed');
      if (msg.includes('EVENT_FULL'))
        throw new BadRequestException('Event is already full');
      if (msg.includes('ALREADY_REGISTERED'))
        throw new BadRequestException('Already registered for this event');

      // Retryable: lock contention from PgBouncer connection reuse
      const isLockError = msg.toLowerCase().includes('lock');
      if (isLockError && attempt < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, 100 * (attempt + 1))); // 100ms, 200ms
        continue;
      }

      throw error;
    }

    // All retries exhausted
    throw new BadRequestException(
      'Registration is temporarily busy — please try again in a moment.',
    );
  }

  async cancelRsvp(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    // Resolve volunteer profile id from auth user id
    const { data: volProfile, error: volError } = await supabase
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (volError || !volProfile)
      throw new NotFoundException('Volunteer profile not found');

    // Find the active registration
    const { data: reg, error: regError } = await supabase
      .from('event_registrations')
      .select('id, status, payment_id')
      .eq('event_id', eventId)
      .eq('volunteer_id', volProfile.id)
      .maybeSingle();

    if (regError) throw new BadRequestException(regError.message);
    if (!reg) throw new NotFoundException('Registration not found');

    // Block cancellation if already checked in or completed
    if (reg.status === 'checked_in' || reg.status === 'completed') {
      throw new BadRequestException(
        'Cannot cancel a registration that is already checked in or completed',
      );
    }

    // Paid registration: compute the tiered refund (80% if cancelling more
    // than 24h before the registration deadline, else 0%) and refund via
    // Razorpay BEFORE deleting the row. If the refund call itself fails, do
    // NOT delete the registration — the volunteer's money hasn't moved, so
    // deleting now would silently lose it. No org clawback is needed either
    // way: the org isn't paid until event completion, and the bill
    // computation only counts registrations that still exist at that point.
    if (reg.payment_id) {
      const { data: eventForDeadline } = await supabase
        .from('events')
        .select('registration_deadline')
        .eq('id', eventId)
        .maybeSingle();

      await this.paymentsService.refundForVolunteerCancellation(
        reg.payment_id,
        eventForDeadline?.registration_deadline ?? null,
      );
    }

    // Delete the registration record entirely
    const { error: deleteError } = await supabase
      .from('event_registrations')
      .delete()
      .eq('id', reg.id);

    if (deleteError) throw new BadRequestException(deleteError.message);

    // registered_count is maintained automatically by the DB trigger
    // (update_registered_count_trigger) on delete from event_registrations —
    // no manual decrement needed here.

    return { message: 'Registration cancelled successfully' };
  }

  private async sendRsvpEmail(supabase: any, userId: string, eventId: string) {
    const [userResult, eventResult] = await Promise.all([
      supabase.auth.admin.getUserById(userId),
      supabase
        .from('events')
        .select('title, event_date, location')
        .eq('id', eventId)
        .maybeSingle(),
    ]);

    const email = userResult.data?.user?.email;
    const event = eventResult.data;

    if (!email || !event) return;

    const { data: volProfile } = await supabase
      .from('volunteer_profiles')
      .select('full_name')
      .eq('user_id', userId)
      .maybeSingle();

    const name = volProfile?.full_name ?? 'Volunteer';
    const eventDate = event.event_date
      ? new Date(event.event_date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '';

    await this.emailService.sendRSVPConfirmation(
      email,
      name,
      event.title,
      eventDate,
      event.location ?? '',
    );
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

    if (!event)
      throw new ForbiddenException('You can only broadcast to your own events');

    const { data, error } = await supabase
      .from('event_broadcasts')
      .insert({
        event_id: eventId,
        organization_id: orgProfile.id,
        message: message,
        is_important: true,
      })
      .select(
        'id, event_id, organization_id, message, is_important, created_at',
      )
      .single();

    if (error) throw error;
    return { message: 'Broadcast sent successfully', broadcast: data };
  }

  async getEventBroadcasts(eventId: string) {
    const supabase = this.supabaseService.getClient() as any;

    const { data: broadcasts, error } = await supabase
      .from('event_broadcasts')
      .select('id, message, is_important, created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { broadcasts };
  }

  async deleteBroadcast(userId: string, eventId: string, broadcastId: string) {
    const supabase = this.supabaseService.getClient() as any;
    const { data: orgProfile } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
    if (!orgProfile) throw new NotFoundException('Organization not found');

    const { error } = await supabase
      .from('event_broadcasts')
      .delete()
      .eq('id', broadcastId)
      .eq('organization_id', orgProfile.id);
    if (error) throw error;
    return { message: 'Broadcast deleted successfully' };
  }

  async getRecentActivity(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: orgProfile } = await supabase
      .from('organization_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
    if (!orgProfile) throw new NotFoundException('Organization not found');

    const { data: events } = await supabase
      .from('events')
      .select('title, created_at')
      .eq('organization_id', orgProfile.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: registrations } = await supabase
      .from('event_registrations')
      .select(
        `
        status, 
        registered_at, 
        checked_in_at,
        volunteer_profiles(full_name),
        events!inner(title, organization_id) 
      `,
      )
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

    const { data: orgProfile } = await supabase
      .from('organization_profiles')
      .select('id, signature_url')
      .eq('user_id', userId)
      .single();
    if (!orgProfile) throw new NotFoundException('Organization not found');
    validateImageFile(file);

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${orgProfile.id}-${Date.now()}.${fileExt}`;
    const filePath = `signatures/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('org-signatures')
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (uploadError)
      throw new BadRequestException('Failed to upload signature');

    const {
      data: { publicUrl },
    } = supabase.storage.from('org-signatures').getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from('organization_profiles')
      .update({ signature_url: publicUrl })
      .eq('id', orgProfile.id);

    if (dbError) throw dbError;

    // Remove the previous signature file so it doesn't orphan.
    await removeFromStorage(supabase, 'org-signatures', [
      orgProfile.signature_url,
    ]);

    return {
      message: 'Signature uploaded successfully',
      signatureUrl: publicUrl,
    };
  }

  async issueCertificates(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: orgProfile } = await supabase
      .from('organization_profiles')
      .select('id, signature_url')
      .eq('user_id', userId)
      .single();
    if (!orgProfile) throw new NotFoundException('Organization not found');

    if (!orgProfile.signature_url) {
      throw new BadRequestException(
        'You must upload your organization signature/stamp before issuing certificates.',
      );
    }

    const { data: event } = await supabase
      .from('events')
      .select('status')
      .eq('id', eventId)
      .eq('organization_id', orgProfile.id)
      .single();
    if (!event)
      throw new ForbiddenException('Event not found or access denied');
    if (event.status !== 'completed')
      throw new BadRequestException(
        'Event must be marked as completed before issuing certificates.',
      );

    const { error } = await supabase
      .from('events')
      .update({ certificates_issued: true })
      .eq('id', eventId);

    if (error) throw error;

    return { message: 'Certificates issued successfully' };
  }

  // In EventService class

  async submitReview(
    userId: string,
    eventId: string,
    rating: number,
    comment?: string,
  ) {
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

    // 3. Verify the volunteer attended this event
    const { data: registration } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('volunteer_id', volProfile.id)
      .in('status', ['checked_in', 'completed'])
      .maybeSingle();

    if (!registration)
      throw new ForbiddenException(
        'Only volunteers who attended this event can leave a review',
      );

    // 4. Check if review already exists (prevents duplicates)
    const { data: existing } = await supabase
      .from('organization_reviews')
      .select('id')
      .eq('event_id', eventId)
      .eq('volunteer_id', volProfile.id)
      .maybeSingle();

    if (existing)
      throw new BadRequestException('You have already reviewed this event');

    // 5. Insert Review
    const { error } = await supabase.from('organization_reviews').insert({
      organization_id: event.organization_id,
      volunteer_id: volProfile.id,
      event_id: eventId,
      rating: rating,
      comment: comment,
    });

    if (error)
      throw new BadRequestException(
        'Failed to submit review: ' + error.message,
      );

    return { message: 'Review submitted successfully' };
  }

  // Add this method
  async getVolunteerReview(userId: string, eventId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: volProfile } = await supabase
      .from('volunteer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!volProfile) return null;

    const { data: review } = await supabase
      .from('organization_reviews')
      .select('id, rating, comment, created_at')
      .eq('event_id', eventId)
      .eq('volunteer_id', volProfile.id)
      .maybeSingle();

    return { review };
  }

  // --- ADMIN GOD MODE APIs ---

  // Get all pending events
  async getPendingEvents() {
    const supabase = this.supabaseService.getClient();

    const { data: events, error } = await supabase
      .from('events')
      .select(
        `
      *,
      organization_profiles (
        name,
        email,
        phone
      )
    `,
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { events };
  }

  // Admin route to forcefully approve and edit an event
  async adminApproveEvent(
    eventId: string,
    updateData: Partial<CreateEventDto>,
    actorId: string,
    actorEmail: string | null,
  ) {
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
    Object.keys(dbUpdateData).forEach((key) => {
      if (dbUpdateData[key] === undefined) {
        delete dbUpdateData[key];
      }
    });

    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update(dbUpdateData)
      .eq('id', eventId)
      .select('id, title, status, event_date, start_time, location, updated_at')
      .single();

    if (error) throw error;

    await this.auditService.log(
      actorId,
      actorEmail,
      'event.approved',
      'event',
      eventId,
      { title: updatedEvent.title },
    );

    return { message: 'Event approved and published!', event: updatedEvent };
  }

  private async sendCancellationEmails(
    supabase: any,
    eventId: string,
    event: any,
  ) {
    const { data: regs } = await supabase
      .from('event_registrations')
      .select('volunteer_profiles(user_id, full_name)')
      .eq('event_id', eventId)
      .in('status', ['registered', 'checked_in']);

    if (!regs?.length) return;

    const eventDate = event.event_date
      ? new Date(event.event_date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '';

    await Promise.all(
      regs.map(async (reg: any) => {
        const profile = reg.volunteer_profiles;
        if (!profile?.user_id) return;
        const { data: userResult } = await supabase.auth.admin.getUserById(
          profile.user_id,
        );
        const email = userResult?.user?.email;
        if (!email) return;
        await this.emailService.sendEventCancellation(
          email,
          profile.full_name ?? 'Volunteer',
          event.title ?? 'Your event',
          eventDate,
          event.location ?? '',
        );
      }),
    );
  }

  private async sendImpactEmails(supabase: any, eventId: string, event: any) {
    const { data: regs } = await supabase
      .from('event_registrations')
      .select('volunteer_profiles(user_id, full_name)')
      .eq('event_id', eventId)
      .eq('status', 'completed');

    if (!regs?.length) return;

    // Per-volunteer credited hours for this event (single source: eventHours)
    const hours = eventHours(event.start_time, event.end_time);

    await Promise.all(
      regs.map(async (reg: any) => {
        const profile = reg.volunteer_profiles;
        if (!profile?.user_id) return;
        const { data: userResult } = await supabase.auth.admin.getUserById(
          profile.user_id,
        );
        const email = userResult?.user?.email;
        if (!email) return;
        await this.emailService.sendImpactLogged(
          email,
          profile.full_name ?? 'Volunteer',
          event.title ?? 'your event',
          hours,
        );
      }),
    );
  }
}
