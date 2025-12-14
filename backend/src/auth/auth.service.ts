import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { VolunteerSignupDto } from './dto/volunteer-signup.dto';
import { OrganizationSignupDto } from './dto/organization-signup.dto';

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) { }

  async signupVolunteer(dto: VolunteerSignupDto) {
    const supabase = this.supabaseService.getClient();

    // Create auth user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true, // Auto-confirm email for now
      user_metadata: {
        user_type: 'volunteer',
        full_name: dto.fullName,
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new ConflictException('Email already registered');
      }
      throw new BadRequestException(authError.message);
    }

    // Create volunteer profile
    const { data: profile, error: profileError } = await supabase
      .from('volunteer_profiles')
      .insert({
        user_id: authData.user.id,
        full_name: dto.fullName,
        phone: dto.phone,
        city: dto.city,
        interests: dto.interests,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new BadRequestException('Failed to create profile');
    }

    return {
      message: 'Volunteer registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        userType: 'volunteer',
        profile: {
          fullName: profile.full_name,
          phone: profile.phone,
          city: profile.city,
          interests: profile.interests,
        },
      },
    };
  }

  async signupOrganization(dto: OrganizationSignupDto) {
    const supabase = this.supabaseService.getClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: {
        user_type: 'organization',
        org_name: dto.name,
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new ConflictException('Email already registered');
      }
      throw new BadRequestException(authError.message);
    }

    // Create organization profile
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
      // Rollback
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new BadRequestException('Failed to create organization profile');
    }

    return {
      message: 'Organization application submitted. Awaiting approval.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        userType: 'organization',
        approvalStatus: profile.approval_status,
      },
    };
  }
}