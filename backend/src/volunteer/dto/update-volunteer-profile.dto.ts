import { IsOptional, IsString, IsArray, IsUrl, IsIn, IsBoolean } from 'class-validator';

export class UpdateVolunteerProfileDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string; // ✅ NEW

  @IsOptional()
  @IsString()
  phone?: string;   // ✅ NEW

  @IsOptional()
  @IsString()
  email?: string;   // ✅ NEW

  @IsOptional()
  @IsString()
  linkedin?: string; // ✅ NEW

  @IsOptional()
  @IsString()
  instagram?: string;  // ✅ NEW

  @IsOptional()
  @IsString()
  website?: string;  // ✅ NEW

  @IsOptional()
  @IsArray()
  skills?: string[];

  @IsOptional()
  @IsArray()
  interests?: string[];

  @IsOptional()
  @IsIn(['weekends', 'weekdays', 'remote', 'flexible'])
  availability_status?: string;

  @IsOptional()
  @IsUrl()
  avatar_url?: string;

  @IsOptional()
  @IsUrl()
  cover_url?: string;

  @IsOptional()
  @IsBoolean()
  is_private?: boolean;
}