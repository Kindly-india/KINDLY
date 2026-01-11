import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface VolunteerSignupData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  city: string;
  interests: string[];
}

export interface OrganizationSignupData {
  orgType: string;
  name: string;
  email: string;
  password: string;
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
  totalSlots: number;
  registrationDeadline: string;
  minimumAge?: number;
  gallery_images?: string[];
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

    // Now sign in the user with Supabase client
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      throw new Error('Account created but auto-login failed. Please log in manually.');
    }

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
      const { data, error } = await supabase
        .from('organization_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return { userType: 'organization', profile: data };
    }

    return null;
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

  // Get public events
  getPublicEvents: async () => {
    const response = await fetch(`${API_URL}/events/public`);

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
  selfCheckIn: async (data: { eventId: string; code: string; latitude: number; longitude: number }) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/events/self-check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    const resData = await response.json()
    if (!response.ok) {
      throw new Error(resData.message || 'Check-in failed')
    }
    return resData
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

  getEventBroadcasts: async (eventId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || localStorage.getItem('token');

    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_URL}/events/${eventId}/broadcasts`, { headers });
      if (!response.ok) return { broadcasts: [] };
      return response.json();
    } catch (e) {
      return { broadcasts: [] };
    }
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

  issueCertificates: async (eventId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/events/${eventId}/issue-certificates`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to issue certificates');
    }
    return response.json();
  },

  // ============ VOLUNTEER PROFILE ============
  getVolunteerPublicProfile: async (volunteerId: string) => {
    const token = localStorage.getItem('token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/volunteers/${volunteerId}/profile`, {
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
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

  // ============ ORGANIZATION PROFILE ============
  getOrgPublicProfile: async (orgId: string) => {
    const token = localStorage.getItem('token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/organizations/${orgId}/profile`, {
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch organization profile');
    return response.json();
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

  // ✅ FIX: Add cache-busting timestamp
  // In src/lib/api.ts
  getFollowStatus: async (targetUserId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: any = {};

    // Prefer Session token, fallback to localStorage if needed
    const token = session?.access_token || localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    if (!token) return { isFollowing: false };

    // ⚡ THE IMPORTANT PART: ?t=${Date.now()}
    const response = await fetch(`${API_URL}/social/follow/status/${targetUserId}?t=${Date.now()}`, {
      headers
    });

    if (!response.ok) return { isFollowing: false };
    return response.json();
  },

  getVolunteerImpact: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/analytics/volunteer`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },
  getOrgAnalytics: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/analytics/org`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
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
};