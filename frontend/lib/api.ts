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

  // Get single event by ID (Authenticated)
  getEventById: async (eventId: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    // If no session, fallback to public endpoint
    if (!session) {
        return api.getPublicEventById(eventId);
    }

    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch event');
    }

    return response.json();
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

  // --- FIXED: This function name now matches your frontend call ---
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
    
    // Returns: { events: [...] }
    return data;
  },

  // Keep this alias for the History page
  getVolunteerRegistrations: async () => {
    return api.getMyRegistrations();
  },

  // Helper alias for backward compatibility
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
// ✅ THIS WAS MISSING - DELETE FUNCTION
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
// ✅ NEW: Activity Feed
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
      // Return empty array on error to prevent page crash
      return { activities: [] };
    }
    return response.json();
  },

  // ✅ NEW: Upload Signature
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

  // ✅ NEW: Issue Certificates
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
};