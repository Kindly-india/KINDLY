import { IsOptional, IsString, IsNumber, IsArray, IsEmail, IsUrl, MaxLength, ArrayMaxSize } from 'class-validator';

export class UpdateOrganizationProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  org_type?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

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
}
