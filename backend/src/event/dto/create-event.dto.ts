import { IsString, IsNotEmpty, IsInt, IsBoolean, IsOptional, IsIn, IsUrl, IsNumber, Min, IsDateString, IsArray } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @IsString()
  @IsIn(['nature_outdoors', 'food_hunger', 'animal_welfare', 'elderly_care', 'education_mentoring', 'health_medical', 'art_culture', 'civic_community', 'women_empowerment', 'youth_sports', 'mental_wellness', 'donation_drives'])
  category: string;

  @IsBoolean()
  isUrgent: boolean;

  @IsString()
  @IsNotEmpty()
  eventDate: string; // Format: YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  startTime: string; // Format: HH:MM

  @IsString()
  @IsNotEmpty()
  endTime: string; // Format: HH:MM

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsOptional()
  @IsString()
  dressCode?: string;

  @IsOptional()
  @IsString()
  thingsToBring?: string;

  @IsString()
  @IsNotEmpty()
  pointOfContact: string;

  @IsOptional()
  @IsString()
  connectPlan?: string;

  @IsInt()
  @Min(1)
  totalSlots: number;

  @IsDateString() // Updated to validate ISO date string
  @IsNotEmpty()
  registrationDeadline: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minimumAge?: number;

  @IsOptional()
  @IsArray()
  galleryImages?: string[];

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}