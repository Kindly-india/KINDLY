import { IsOptional, IsString, IsNumber, IsArray, IsEmail, IsUrl } from 'class-validator'; // ✅ Make sure IsArray is imported

export class UpdateOrganizationProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  org_type?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

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
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsNumber()
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

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  cover_url?: string;

  // ✅ THESE ARE THE MISSING FIELDS CAUSING THE 400 ERROR
  @IsOptional()
  @IsArray()
  team_members?: any[];

  @IsOptional()
  @IsArray()
  achievements?: any[];
}