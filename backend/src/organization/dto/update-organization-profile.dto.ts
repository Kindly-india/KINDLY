import { IsOptional, IsString, IsNumber, IsArray, IsUrl, MaxLength, ArrayMaxSize, Matches } from 'class-validator';

export class UpdateOrganizationProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  org_type?: string;

  // email is intentionally not here — it must change in lockstep with the
  // Supabase Auth login email, so it goes through the dedicated
  // PATCH /organizations/email endpoint (ChangeEmailDto) instead.

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  mission_statement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  intent_description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  area_locality?: string;

  @IsOptional()
  @IsUrl({ require_protocol: false })
  website?: string;

  @IsOptional()
  @IsUrl({ require_protocol: false })
  linkedin?: string;

  @IsOptional()
  @IsUrl({ require_protocol: false })
  instagram?: string;

  @IsOptional()
  @IsNumber()
  years_active?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  registration_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  representative_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  parent_institution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  coordinator_name?: string;

  // System-generated URLs from Supabase storage — require full URL
  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @IsOptional()
  @IsUrl()
  cover_url?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  team_members?: any[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  achievements?: any[];

  // Used for manually paying out the org's share of paid-event ticket sales
  // (see FINANCE.md — no automated Razorpay Payouts in v1). Shown to the org
  // on its own bill and to the superadmin on the payments dashboard.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[\w.\-]{2,49}@[a-zA-Z]{2,49}$/, { message: 'upi_id must look like a UPI ID, e.g. name@bank' })
  upi_id?: string;
}
