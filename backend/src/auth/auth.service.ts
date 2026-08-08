import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from '../email/email.service';
import { OrganizationSignupDto } from './dto/organization-signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private emailService: EmailService,
  ) {}

  async signupOrganization(dto: OrganizationSignupDto) {
    const supabase = this.supabaseService.getClient();

    // 1. Create the auth user via the admin API — no password. Organizations
    // are password-less: they apply here, an admin approves the application
    // (approval_status flips to 'approved'), and from then on they log in
    // through the same email+OTP flow volunteers use. email_confirm: true
    // means the account is usable the moment it's approved, with no separate
    // "click this link to verify your email" step ever required.
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: dto.email,
        email_confirm: true,
        user_metadata: {
          user_type: 'organization',
          org_type: dto.orgType,
        },
      });

    if (authError) {
      if (
        authError.message.includes('already registered') ||
        authError.message.includes('already been registered')
      ) {
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
      .select('id')
      .single();

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new BadRequestException('Failed to create organization profile');
    }

    return {
      message:
        "Application submitted. We'll review it and email you once it's approved — no password or email verification needed, just log in with your email once you hear from us.",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile,
      },
    };
  }

  // Gate for the universal email+OTP sign-in: signInWithOtp will happily
  // auto-create a brand-new account for any email typed in. Without this
  // check, an organization that applied but isn't approved yet could type
  // their email into the same box and get treated as a fresh volunteer
  // signup. This looks the email up against pending applications first so
  // the frontend can block the OTP send and show a "still under review"
  // message instead.
  async checkOrgStatus(email: string): Promise<{ status: 'pending' | 'ok' }> {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('organization_profiles')
      .select('approval_status')
      .eq('email', email)
      .maybeSingle();

    if (data?.approval_status === 'pending') {
      return { status: 'pending' };
    }
    return { status: 'ok' };
  }

  async dispatchWelcomeEmail(userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // Resolve email from Supabase auth (source of truth)
    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(userId);
    const email = user?.email;
    if (!email) return;

    // Check volunteer profile first
    const { data: vol } = await supabase
      .from('volunteer_profiles')
      .select('full_name')
      .eq('user_id', userId)
      .maybeSingle();

    if (vol) {
      this.emailService
        .sendWelcomeEmail(email, vol.full_name, 'volunteer')
        .catch(() => {});
      return;
    }

    // Fall back to org profile
    const { data: org } = await supabase
      .from('organization_profiles')
      .select('name')
      .eq('user_id', userId)
      .maybeSingle();

    if (org) {
      this.emailService
        .sendWelcomeEmail(email, org.name, 'org')
        .catch(() => {});
    }
  }

  async resetPassword(email: string) {
    const supabase = this.supabaseService.getClient();

    // Supabase built-in magic to send the reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL ?? process.env.SITE_URL ?? 'http://localhost:3000'}/update-password`,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Password reset link sent successfully' };
  }

  async updatePassword(password: string, hash: string) {
    const supabase = this.supabaseService.getClient();

    // 1. Extract the secure tokens from the frontend URL hash
    // The hash looks like #access_token=123&refresh_token=456
    const params = new URLSearchParams(hash.replace('#', ''));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) {
      throw new BadRequestException(
        'Invalid or expired reset link. Please request a new one.',
      );
    }

    // 2. Temporarily set the session using those tokens
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      throw new BadRequestException(
        'Session expired. Please request a new reset link.',
      );
    }

    // 3. Update the user's password securely
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      throw new BadRequestException(updateError.message);
    }

    // 4. Force a sign out so they have to log in normally with the new password
    await supabase.auth.signOut();

    return { message: 'Password updated successfully' };
  }
}
