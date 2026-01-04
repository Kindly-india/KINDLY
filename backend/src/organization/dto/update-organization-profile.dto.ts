import { IsOptional, IsString, IsUrl, IsInt, IsEmail } from 'class-validator';

export class UpdateOrganizationProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  mission_statement?: string;

  @IsOptional()
  @IsString()
  intent_description?: string;

  @IsOptional()
  @IsString()
  area_locality?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @IsOptional()
  @IsUrl()
  cover_url?: string;

  @IsOptional()
  @IsInt()
  years_active?: number;

  @IsOptional()
  @IsString()
  registration_number?: string;

  @IsOptional()
  @IsString()
  representative_name?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  parent_institution?: string;

  @IsOptional()
  @IsString()
  coordinator_name?: string;

  // ⚠️ IMPORTANT: org_type should NOT be updatable
  // But we need to accept it to avoid validation errors
  // The service will ignore it
}