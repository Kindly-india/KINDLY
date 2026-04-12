import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { VolunteerSignupDto } from './dto/volunteer-signup.dto';
import { OrganizationSignupDto } from './dto/organization-signup.dto';

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) { }

  async signupVolunteer(dto: VolunteerSignupDto) {
    const supabase = this.supabaseService.getClient();

    // 1. Sign up the user (Triggers confirmation email if enabled in Supabase)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          user_type: 'volunteer',
          full_name: dto.fullName,
        },
        // Replace with your actual deployed frontend URL
        // emailRedirectTo: 'https://your-frontend-url.com/login',
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new ConflictException('Email already registered');
      }
      throw new BadRequestException(authError.message);
    }

    if (!authData.user) {
      throw new BadRequestException('User creation failed');
    }

    // 2. Create volunteer profile
    // Note: If email confirmation is ON, the user cannot login yet, 
    // but we still create the profile so it's ready when they verify.
    const { data: profile, error: profileError } = await supabase
      .from('volunteer_profiles')
      .insert({
        user_id: authData.user.id,
        full_name: dto.fullName,
        phone: dto.phone,
        city: dto.city,
        interests: dto.interests,
        total_hours: 0,
      })
      .select()
      .single();

    if (profileError) {
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (rollbackError) {
        // Log for manual cleanup — the profile failure is the real error
        console.error(
          `CRITICAL: Failed to rollback auth user ${authData.user.id} after profile creation failure.`,
          rollbackError
        );
      }
      throw new BadRequestException(
        'Failed to create volunteer profile. Please try again or contact support.'
      );
    }

    return {
      message: 'Signup successful. Please check your email to verify your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile,
      },
    };
  }

  async signupOrganization(dto: OrganizationSignupDto) {
    const supabase = this.supabaseService.getClient();

    // 1. Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          user_type: 'organization',
          org_type: dto.orgType,
        },
        // Replace with your actual deployed frontend URL
        // emailRedirectTo: 'https://your-frontend-url.com/login',
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new ConflictException('Email already registered');
      }
      throw new BadRequestException(authError.message);
    }

    if (!authData.user) {
      throw new BadRequestException('User creation failed');
    }

    // 2. Create organization profile
    const { data: profile, error: profileError } = await supabase
      .from('organization_profiles')
      .insert({
        user_id: authData.user.id,
        org_type: dto.orgType,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        registration_type: dto.registrationType,
        registration_number: dto.registrationNumber,
        representative_name: dto.representativeName,
        designation: dto.designation,
        website: dto.website,
        parent_institution: dto.parentInstitution,
        coordinator_name: dto.coordinatorName,
        area_locality: dto.areaLocality,
        intent_description: dto.intentDescription,
        registration_certificate_url: dto.registrationCertificateUrl,
        pan_card_url: dto.panCardUrl,
        proof_document_url: dto.proofDocumentUrl,
        approval_status: 'pending',
      })
      .select()
      .single();

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new BadRequestException('Failed to create organization profile');
    }

    return {
      message: 'Organization application submitted. Please check your email to verify your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile,
      },
    };
  }
}