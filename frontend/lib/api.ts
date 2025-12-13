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
}

export const api = {
  // Volunteer signup - still goes through backend to create profile
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
    // Organizations don't auto-login (need approval)
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
};