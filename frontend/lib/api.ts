import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Posts ────────────────────────────────────────────────────────────────────

export interface PostAuthor {
  id: string
  user_id: string
  full_name: string
  avatar_url: string | null
  is_verified: boolean
}

export interface PostEvent {
  id: string
  title: string
}

export interface Post {
  id: string
  volunteer_id: string
  event_id: string
  photo_urls: string[]
  caption: string | null
  created_at: string
  volunteer: PostAuthor
  event: PostEvent
  like_count: number
  comment_count: number
  viewer_has_liked: boolean
}

export interface PostComment {
  id: string
  content: string
  created_at: string
  volunteer: Omit<PostAuthor, 'is_verified'>
}

export interface FeedResponse {
  posts: Post[]
  page: number
  limit: number
}

export interface VolunteerPostsResponse {
  posts: Post[]
  is_private: boolean
}

// ─────────────────────────────────────────────────────────────────────────────

export interface VolunteerSignupData {
  fullName: string;
  email: string;
  password: string;
  city: string;
  interests: string[];
}

export interface OrganizationSignupData {
  orgType: string;
  name: string;
  email: string;
  phone: string;
  registrationType?: string;
  registrationNumber?: string;
  representativeName?: string;
  designation?: string;
  website?: string;
  parentInstitution?: string;
  coordinatorName?: string;
  areaLocality?: string;
  intentDescription?: string;
  registrationCertificateUrl?: string;
  panCardUrl?: string;
  proofDocumentUrl?: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  coverImageUrl?: string;
  category: string;
  isUrgent: boolean;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  dressCode?: string;
  thingsToBring?: string;
  totalSlots?: number | null;
  registrationDeadline: string;
  minimumAge?: number;
  gallery_images?: string[];
  pointOfContact: string;
  connectPlan?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateVolunteerProfileDto {
  full_name?: string;
  headline?: string;
  bio?: string;
  city?: string;
  phone?: string;
  email?: string;
  address?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
  skills?: string[];
  interests?: string[];
  availability_status?: string;
  avatar_url?: string;
  cover_url?: string;
  is_private?: boolean;
}

export interface UpdateOrganizationProfileDto {
  name?: string;
  org_type?: string;
  email?: string;
  phone?: string;
  tagline?: string;
  mission_statement?: string;
  intent_description?: string;
  area_locality?: string;
  website?: string;
  years_active?: number;
  registration_number?: string;
  representative_name?: string;
  designation?: string;
  parent_institution?: string;
  coordinator_name?: string;
  logo_url?: string;
  cover_url?: string;
}

export interface VolunteerCertificate {
  id: string;
  verification_id: string;
  issued_at: string;
  hours_credited: number;
  event_id: string;
  event_title: string;
  event_date: string;
  org_name: string;
}

export interface ShowcaseData {
  event: any;
  registration: { id: string; status: string };
  certificate: VolunteerCertificate | null;
  review: { rating: number; comment: string } | null;
}

export interface EventCertificate {
  id: string;
  verification_id: string;
  issued_at: string;
  hours_credited: number;
  volunteer_id: string;
  volunteer_name: string;
  volunteer_avatar: string | null;
}

export const api = {
  // Volunteer signup
  signupVolunteer: async (data: VolunteerSignupData) => {
    const response = await fetch(`${API_URL}/auth/signup/volunteer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    const result = await response.json();

    return result;
  },


  // Organization signup
  signupOrganization: async (data: OrganizationSignupData) => {
    const response = await fetch(`${API_URL}/auth/signup/organization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    return response.json();
  },

  // Pre-flight check the universal sign-in box runs before sending an OTP —
  // organizations are password-less and gated by admin approval, so this
  // blocks a still-pending org's email from silently self-provisioning a
  // brand-new (unapproved) account through the ordinary OTP flow.
  checkOrgApplicationStatus: async (email: string): Promise<{ status: 'pending' | 'ok' }> => {
    const response = await fetch(`${API_URL}/auth/check-org-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) return { status: 'ok' };
    return response.json();
  },

  // Login
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Logout
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Clear RBAC role cookie so middleware doesn't grant stale access
    document.cookie = 'kindly_role=; path=/; max-age=0; SameSite=Lax'
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get user profile based on type
  getUserProfile: async () => {
    const user = await api.getCurrentUser();
    if (!user) return null;

    const userType = user.user_metadata?.user_type;

    if (userType === 'volunteer') {
      const { data, error } = await supabase
        .from('volunteer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return { userType: 'volunteer', profile: data };
    } else if (userType === 'organization') {
      // Routed through the backend (service-role client) instead of a direct
      // Supabase query — organization_profiles doesn't have a working RLS
      // SELECT policy for the owner, so the anon-key client came back empty.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await fetch(`${API_URL}/organizations/${user.id}/profile`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to load organization profile');

      const result = await response.json();
      return { userType: 'organization', profile: result.profile };
    }

    return null;
  },

  // Backfill volunteer_profiles for OTP signups (AuthCard's name-capture step) —
  // password-based signupVolunteer() creates this row inline, OTP signups don't.
  ensureVolunteerProfile: async (fullName: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/volunteers/me/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ full_name: fullName }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to save your name');
    }

    return response.json();
  },

  // Upload event cover image
  uploadEventImage: async (file: File): Promise<string> => {
    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPG and PNG images are allowed');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `events/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('event-images')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  // Create event
  createEvent: async (data: CreateEventData) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create event');
    }

    return response.json();
  },

  // Get organization's events
  getMyEvents: async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/events/my-events`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch events');
    }

    return response.json();
  },

  // All completed events across all organisations (public, no auth needed)
  getCompletedEvents: async (): Promise<{ events: Array<{
    id: string;
    title: string;
    cover_image_url: string | null;
    event_date: string;
    location: string;
    org_name: string | null;
    org_logo_url: string | null;
    org_id: string;
    attendee_count: number;
    total_hours: number;
  }> }> => {
    const response = await fetch(`${API_URL}/events/completed`);
    if (!response.ok) throw new Error('Failed to fetch completed events');
    return response.json();
  },

  // Get public events (passes token if logged in for personalized feed ordering)
  getPublicEvents: async (location?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

    const url = location
      ? `${API_URL}/events/public?location=${encodeURIComponent(location)}`
      : `${API_URL}/events/public`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch events');
    }

    return response.json();
  },

  // Get single event by ID (Authenticated with Public Fallback)
  getEventById: async (eventId: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    // 1. If logged in, try the Authenticated Endpoint first
    if (session) {
      try {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          return await response.json();
        }
        // If response is NOT ok (e.g. 404 because event is completed/hidden), 
        // just silently fall through to the public endpoint below.
      } catch (e) {
        // Ignore network errors here and try public
      }
    }

    // 2. Fallback: Use the Public Endpoint
    // This endpoint usually allows viewing basic details of completed events
    return api.getPublicEventById(eventId);
  },

  // Get public event by ID (no auth needed)
  getPublicEventById: async (eventId: string) => {
    // Note: Updated path to match controller 'details/:id'
    const response = await fetch(`${API_URL}/events/details/${eventId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch event');
    }

    return response.json();
  },

  // Register for event
  registerForEvent: async (eventId: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Please login to register for events');
    }

    const response = await fetch(`${API_URL}/events/${eventId}/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to register for event');
    }

    return response.json();
  },

  // Cancel own RSVP for an event
  cancelRsvp: async (eventId: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Please login to cancel registrations');
    }

    const response = await fetch(`${API_URL}/events/${eventId}/rsvp`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel registration');
    }

    return response.json();
  },

  // Get event registrations (for organizations)
  getEventRegistrations: async (eventId: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/events/${eventId}/registrations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch registrations');
    }

    return response.json();
  },

  // Check in volunteer
  checkInVolunteer: async (eventId: string, registrationId: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/events/${eventId}/registrations/${registrationId}/check-in`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check in volunteer');
    }

    return response.json();
  },

  // Undo check-in
  undoCheckIn: async (eventId: string, registrationId: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/events/${eventId}/registrations/${registrationId}/undo-check-in`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to undo check-in');
    }

    return response.json();
  },

  // Cancel event
  cancelEvent: async (eventId: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/events/${eventId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel event');
    }

    return response.json();
  },

  // Update event
  updateEvent: async (eventId: string, data: CreateEventData) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update event');
    }

    return response.json();
  },

  updateEventGallery: async (eventId: string, galleryImages: string[]): Promise<{ gallery_images: string[] }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    const response = await fetch(`${API_URL}/events/${eventId}/gallery`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ galleryImages }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update gallery');
    }
    return response.json();
  },

  // Get Specific Details
  getEventDetails: async (eventId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/events/${eventId}`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });
    if (!response.ok) throw new Error('Failed to load event');
    return response.json();
  },

  // Complete Event
  completeEvent: async (eventId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/events/${eventId}/complete`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete event');
    }

    return response.json();
  },

  getMyRegistrations: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/events/my-registrations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch registrations');
    }

    return data;
  },

  getVolunteerRegistrations: async () => {
    return api.getMyRegistrations();
  },

  getEventHistory: async () => {
    return api.getMyRegistrations();
  },

  // Get top events
  getTopEvents: async () => {
    const response = await fetch(`${API_URL}/events/top`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch top events');
    }

    return response.json();
  },

  // Self Check-in
  selfCheckIn: async (data: { eventId: string; latitude: number; longitude: number }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/events/self-check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Check-in failed');
    return resData;
  },

  getEventBroadcasts: async (eventId: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    try {
      const response = await fetch(`${API_URL}/events/${eventId}/broadcasts`, {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (!response.ok) return { broadcasts: [] };
      return response.json();
    } catch (e) {
      console.error('Network error fetching broadcasts:', e);
      return { broadcasts: [], error: 'Network error. Please refresh.' };
    }
  },

  getVolunteerPublicProfile: async (volunteerId: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${API_URL}/volunteers/${volunteerId}/profile`, {
      headers: {
        'Content-Type': 'application/json',
        ...(session && { Authorization: `Bearer ${session.access_token}` }),
      },
    });

    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  getOrgPublicProfile: async (orgId: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${API_URL}/organizations/${orgId}/profile`, {
      headers: {
        'Content-Type': 'application/json',
        ...(session && { Authorization: `Bearer ${session.access_token}` }),
      },
    });

    if (!response.ok) throw new Error('Failed to fetch organization profile');
    return response.json();
  },

  getFollowStatus: async (targetUserId: string): Promise<{ followStatus: 'none' | 'pending' | 'accepted' }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { followStatus: 'none' };

    const response = await fetch(`${API_URL}/social/follow/status/${targetUserId}?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) return { followStatus: 'none' };
    return response.json();
  },

  acceptFollowRequest: async (requestId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/social/follow-requests/${requestId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed'); }
    return res.json();
  },

  rejectFollowRequest: async (requestId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/social/follow-requests/${requestId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed'); }
    return res.json();
  },

  removeFollower: async (followerId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/social/followers/${followerId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed'); }
    return res.json();
  },

  getFollowers: async (userId: string): Promise<{ followers: any[], error: 'forbidden' | 'error' | null }> => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${API_URL}/social/${userId}/followers`, {
      headers: { ...(session && { Authorization: `Bearer ${session.access_token}` }) },
    });
    if (!res.ok) return { followers: [], error: res.status === 403 ? 'forbidden' : 'error' };
    const data = await res.json();
    return { ...data, error: null };
  },

  getFollowing: async (userId: string): Promise<{ following: any[], error: 'forbidden' | 'error' | null }> => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${API_URL}/social/${userId}/following`, {
      headers: { ...(session && { Authorization: `Bearer ${session.access_token}` }) },
    });
    if (!res.ok) return { following: [], error: res.status === 403 ? 'forbidden' : 'error' };
    const data = await res.json();
    return { ...data, error: null };
  },

  getPendingFollowRequests: async (): Promise<{
    requests: {
      requester_id: string
      full_name: string
      avatar_url: string | null
      city: string | null
      headline: string | null
      is_verified: boolean
      requested_at: string
    }[]
    count: number
  }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { requests: [], count: 0 };
    const res = await fetch(`${API_URL}/social/follow-requests/pending`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return { requests: [], count: 0 };
    return res.json();
  },

  getVolunteerImpact: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${API_URL}/analytics/volunteer`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    return res.json();
  },

  getOrgAnalytics: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${API_URL}/analytics/org`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    return res.json();
  },

  sendBroadcast: async (eventId: string, message: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/events/${eventId}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send broadcast');
    }
    return response.json();
  },

  deleteBroadcast: async (eventId: string, broadcastId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/events/${eventId}/broadcast/${broadcastId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete broadcast');
    }
    return response.json();
  },

  getRecentActivity: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/events/recent-activity`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      return { activities: [] };
    }
    return response.json();
  },

  uploadOrgSignature: async (file: File) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/events/org/signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload signature');
    }
    return response.json();
  },

  issueCertificatesForEvent: async (
    eventId: string,
    volunteerUserIds?: string[],
  ): Promise<{ message: string; issued: number; skipped: number; total: number }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const body = volunteerUserIds?.length ? { volunteerUserIds } : {};

    const response = await fetch(`${API_URL}/events/${eventId}/certificates/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to issue certificates');
    }
    return response.json();
  },

  getEventCertificates: async (eventId: string): Promise<{ certificates: EventCertificate[] }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/events/${eventId}/certificates`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch certificates');
    }
    return response.json();
  },

  downloadCertificate: async (certificateId: string): Promise<{ signedUrl: string }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/certificates/${certificateId}/download`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get download URL');
    }
    return response.json();
  },

  getMyCertificates: async (): Promise<{ certificates: VolunteerCertificate[] }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/volunteers/me/certificates`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch certificates');
    }
    return response.json();
  },

  getVolunteerJourney: async (volunteerId: string) => {
    const response = await fetch(`${API_URL}/volunteers/${volunteerId}/journey`);
    if (!response.ok) throw new Error('Failed to fetch journey');
    return response.json();
  },

  updateVolunteerProfile: async (data: UpdateVolunteerProfileDto) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${API_URL}/volunteers/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  savePhone: async (phone: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${API_URL}/phone-verification/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ phone }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || 'Failed to save phone number');
    return body;
  },

  // ✅ NEW: GALLERY FUNCTIONS
  getVolunteerGallery: async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/volunteers/${userId}/gallery`);
      if (!response.ok) return [];
      return await response.json();
    } catch (err) {
      return [];
    }
  },

  uploadGalleryPhoto: async (file: File) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/volunteers/gallery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Upload failed');
    }
    return await response.json();
  },

  deleteGalleryPhoto: async (photoId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/volunteers/gallery/${photoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) throw new Error('Delete failed');
    return true;
  },

  // ── Org Action Gallery ─────────────────────────────────────────────────────

  getOrgGallery: async (orgId: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_URL}/organizations/${orgId}/gallery`);
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  },

  uploadOrgGalleryPhoto: async (file: File): Promise<any> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/organizations/gallery`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Upload failed');
    }
    return await response.json();
  },

  deleteOrgGalleryPhoto: async (photoId: string): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/organizations/gallery/${photoId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });

    if (!response.ok) throw new Error('Delete failed');
  },

  getOrgEvents: async (orgId: string) => {
    const response = await fetch(`${API_URL}/organizations/${orgId}/events`);
    if (!response.ok) throw new Error('Failed to fetch organization events');
    return response.json();
  },

  getOrgVolunteers: async (orgId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/organizations/${orgId}/volunteers`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch volunteers');
    return response.json();
  },

  getOrgReviews: async (orgId: string) => {
    const response = await fetch(`${API_URL}/organizations/${orgId}/reviews`);
    if (!response.ok) return { reviews: [] };
    return response.json();
  },

  updateOrgProfile: async (data: UpdateOrganizationProfileDto) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${API_URL}/organizations/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update org profile');
    return res.json();
  },

  // ============ FOLLOW/UNFOLLOW ============
  toggleFollowOrg: async (orgId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Please login to follow');

    const res = await fetch(`${API_URL}/organizations/${orgId}/follow`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    if (!res.ok) throw new Error('Failed to toggle follow');
    return res.json();
  },

  checkFollowStatus: async (orgId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { isFollowing: false };

    const response = await fetch(`${API_URL}/organizations/${orgId}/follow-status`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });

    if (!response.ok) return { isFollowing: false };
    return response.json();
  },

  // ============ ENDORSEMENTS & REVIEWS ============
  addVolunteerEndorsement: async (data: {
    volunteer_id: string;
    event_id: string;
    skills: string[];
    comment?: string;
  }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/volunteers/endorsements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to add endorsement');
    return response.json();
  },

  addOrgReview: async (data: {
    organization_id: string;
    event_id?: string;
    rating: number;
    comment: string;
  }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Please login to leave a review');

    const response = await fetch(`${API_URL}/organizations/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to add review');
    return response.json();
  },

  // ============ IMAGE UPLOADS ============
  uploadProfileImage: async (file: File, type: 'avatar' | 'cover') => {
    if (file.size > 5 * 1024 * 1024) throw new Error('File must be less than 5MB');

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) throw new Error('Only JPG/PNG allowed');

    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  // --- SOCIAL SEARCH & FOLLOW ---
  globalSearch: async (query: string) => {
    const response = await fetch(`${API_URL}/social/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    return response.json();
  },

  followUser: async (targetUserId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Please login to follow');

    const response = await fetch(`${API_URL}/social/follow/${targetUserId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to follow');
    }
    return response.json();
  },

  unfollowUser: async (targetUserId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Please login to unfollow');

    const response = await fetch(`${API_URL}/social/follow/${targetUserId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to unfollow');
    }
    return response.json();
  },

  submitEventReview: async (eventId: string, rating: number, comment: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch(`${API_URL}/events/${eventId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ rating, comment }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to submit review');
    }
    return res.json();
  },

  getShowcaseData: async (eventId: string): Promise<ShowcaseData> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/events/${eventId}/showcase`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Access denied');
    }
    return res.json();
  },

  // In lib/api.ts
  getMyReview: async (eventId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return null;

    const res = await fetch(`${API_URL}/events/${eventId}/review/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) return null;
    return res.json();
  },

  getPlatformStats: async () => {
    try {
      // Ensure your backend has this endpoint, or create it to return { volunteers, organisations, hours, cities }
      const response = await fetch(`${API_URL}/analytics/platform`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch platform stats:', error);
      return null;
    }
  },

  // --- ADMIN ROUTES ---

  getPendingEvents: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/events/admin/pending`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(errorData.message || 'Failed to fetch pending events') as Error & { status?: number };
      err.status = response.status;
      throw err;
    }
    return response.json();
  },

  adminApproveEvent: async (eventId: string, eventData: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/events/admin/approve/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to approve event');
    }
    return response.json();
  },

  // Location search for event creation/editing — proxied through the backend
  // (Ola Maps) instead of calling a geocoder directly from the browser.
  searchLocations: async (query: string, lat: number, lng: number): Promise<{ suggestions: { label: string; lat: number; lng: number }[] }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const params = new URLSearchParams({ q: query, lat: String(lat), lng: String(lng) });
    const response = await fetch(`${API_URL}/events/location-autocomplete?${params}`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });
    if (!response.ok) throw new Error('Location search failed');
    return response.json();
  },

  reverseGeocodeLocation: async (lat: number, lng: number): Promise<{ label: string | null }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    const response = await fetch(`${API_URL}/events/location-reverse-geocode?${params}`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });
    if (!response.ok) throw new Error('Reverse geocoding failed');
    return response.json();
  },

  // Fire after email verification — sends the Welcome email exactly once
  sendWelcomeEmail: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`${API_URL}/auth/welcome-email`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    }).catch(() => {});
  },

  // --- PASSWORD RESET ---
  async resetPassword(email: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to send reset link');
    }
    
    return response.json();
  },

  // Complete onboarding
  patchOnboarding: async (data: { interest_tags: string[]; preferred_availability: string; social_preference: string }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/volunteers/me/onboarding`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to save onboarding');
    }
    return response.json();
  },

// --- NOTIFICATIONS ---
  async getNotifications(before?: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { notifications: [], hasMore: false };
    const url = before
      ? `${API_URL}/notifications?before=${encodeURIComponent(before)}`
      : `${API_URL}/notifications`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) return { notifications: [], hasMore: false };
    return response.json();
  },

  async getUnreadCount() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { count: 0 };
    const response = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) return { count: 0 };
    return response.json();
  },

  async markAllNotificationsRead() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
  },

  async getSearchHistory(): Promise<any[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const res = await fetch(`${API_URL}/social/search/recent`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async saveSearchHistory(item: { result_id: string; result_type: string; result_name: string; result_image?: string | null }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`${API_URL}/social/search/recent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(item),
    });
  },

  async clearSearchHistory() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`${API_URL}/social/search/recent`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
  },

  async removeSearchHistoryItem(id: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`${API_URL}/social/search/recent/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
  },

  async deleteNotification(notifId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/notifications/${notifId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed'); }
    return res.json();
  },

// --- POSTS ---

  uploadPostPhoto: async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `posts/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('post-photos')
      .upload(filePath, file);

    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = supabase.storage
      .from('post-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  createPost: async (data: { event_id: string; photo_urls: string[]; caption?: string }): Promise<Post> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to create post'); }
    return res.json();
  },

  getSuggestedPeople: async (): Promise<{ suggestions: Array<{ user_id: string; full_name: string; avatar_url: string | null; city: string | null; is_verified: boolean; total_hours: number }> }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { suggestions: [] };
    const res = await fetch(`${API_URL}/social/suggestions`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return { suggestions: [] };
    return res.json();
  },

  getPostsFeed: async (page = 1, limit = 20): Promise<FeedResponse> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { posts: [], page, limit };
    const res = await fetch(`${API_URL}/posts/feed?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) throw new Error('Failed to load feed');
    return res.json();
  },

  getPostableEvents: async (): Promise<{ events: { id: string; title: string; event_date: string; org_name: string; post_count: number }[] }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/volunteers/me/postable-events`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) throw new Error('Failed to load postable events');
    return res.json();
  },

  getVolunteerPosts: async (userId: string): Promise<VolunteerPostsResponse> => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session) headers.Authorization = `Bearer ${session.access_token}`;
    const res = await fetch(`${API_URL}/posts/volunteer/${userId}`, { headers });
    if (!res.ok) throw new Error('Failed to load posts');
    return res.json();
  },

  getPost: async (postId: string): Promise<Post & { comments: PostComment[] }> => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session) headers.Authorization = `Bearer ${session.access_token}`;
    const res = await fetch(`${API_URL}/posts/${postId}`, { headers });
    if (!res.ok) throw new Error('Post not found');
    return res.json();
  },

  deletePost: async (postId: string): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to delete'); }
  },

  togglePostLike: async (postId: string): Promise<{ liked: boolean }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed'); }
    return res.json();
  },

  getPostComments: async (postId: string): Promise<PostComment[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session) headers.Authorization = `Bearer ${session.access_token}`;
    const res = await fetch(`${API_URL}/posts/${postId}/comments`, { headers });
    if (!res.ok) throw new Error('Failed to load comments');
    return res.json();
  },

  addPostComment: async (postId: string, content: string): Promise<PostComment> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to comment'); }
    return res.json();
  },

  deletePostComment: async (postId: string, commentId: string): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');
    const res = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to delete comment'); }
  },

  getPostLikes: async (postId: string): Promise<PostAuthor[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
    const res = await fetch(`${API_URL}/posts/${postId}/likes`, { headers });
    if (!res.ok) return [];
    return res.json();
  },

// --- UPDATE PASSWORD ---
  async updatePassword(newPassword: string, hash: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/update-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Now we pass the safely stored hash from the frontend state
      body: JSON.stringify({ 
        password: newPassword,
        hash: hash 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update password');
    }
    
    return response.json();
  },
};