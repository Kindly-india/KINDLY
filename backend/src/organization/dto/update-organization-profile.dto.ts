import { IsOptional, IsString, IsNumber, IsArray, IsUrl, MaxLength, ArrayMaxSize, Matches, Min, Max, IsNotEmpty, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Trims before validation runs — without this, a trailing space/newline
// (extremely common when a UPI ID or profile link is copy-pasted from a
// phone) fails @Matches/@IsUrl and 400s the *entire* profile save, not just
// this field. See text-normalize.util.ts for why storage re-trims separately.
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

// @IsOptional() only skips validation for null/undefined, NOT ''. The
// edit-profile form always sends `image_url`/`link`/`img` as '' when the user
// didn't add one (addAchievement/addTeamMember don't strip empty nested
// fields the way the top-level payload does) — without this, adding an
// achievement/team member with no image would fail @IsUrl() on '' and 400
// the entire save. Converts '' to undefined first so @IsOptional() actually applies.
const trimOptionalUrl = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

// One entry in the "Key People" list — was previously `any`, so a garbage
// link/image_url (or a 10,000-char description) could go straight into the
// public profile with no check. Structurally the same shape the edit-profile
// form already builds client-side.
export class TeamMemberDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trim)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trim)
  role: string;

  // System-generated (upload-only in the UI) — require a full URL.
  @IsOptional()
  @Transform(trimOptionalUrl)
  @IsUrl()
  img?: string;
}

// One entry in "Wall of Fame". `link`/`image_url` are rendered as raw
// <a href> / <img src> on the public profile, same broken-link risk as the
// top-level website/linkedin/instagram fields.
export class AchievementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(trim)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trim)
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @Transform(trimOptionalUrl)
  @IsUrl()
  image_url?: string;

  @IsOptional()
  @Transform(trimOptionalUrl)
  @IsUrl({ require_protocol: false })
  link?: string;
}

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
  @Transform(trim)
  @IsUrl({ require_protocol: false })
  website?: string;

  @IsOptional()
  @Transform(trim)
  @IsUrl({ require_protocol: false })
  linkedin?: string;

  @IsOptional()
  @Transform(trim)
  @IsUrl({ require_protocol: false })
  instagram?: string;

  // Bounded after finding -5 and 999999 both saved and rendered nonsensically
  // on the public profile — no org realistically predates this range.
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(150)
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
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  team_members?: TeamMemberDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AchievementDto)
  achievements?: AchievementDto[];

  // Used for manually paying out the org's share of paid-event ticket sales
  // (see FINANCE.md — no automated Razorpay Payouts in v1). Shown to the org
  // on its own bill and to the superadmin on the payments dashboard.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  // Handle allows digits too (e.g. some PSP handles aren't purely alphabetic) —
  // widened after finding the letters-only version rejected valid real-world VPAs.
  @Matches(/^[\w.\-]{2,49}@[a-zA-Z0-9]{2,49}$/, { message: 'upi_id must look like a UPI ID, e.g. name@bank' })
  upi_id?: string;
}
