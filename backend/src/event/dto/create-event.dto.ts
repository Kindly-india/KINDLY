import { IsString, IsNotEmpty, IsInt, IsBoolean, IsOptional, IsIn, IsUrl, IsNumber, Min, IsDateString, IsArray, MaxLength, ArrayMaxSize } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
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
  @MaxLength(10)
  eventDate: string; // Format: YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  startTime: string; // Format: HH:MM

  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  endTime: string; // Format: HH:MM

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  location: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dressCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thingsToBring?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  pointOfContact: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  connectPlan?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalSlots?: number | null;

  @IsDateString()
  @IsNotEmpty()
  registrationDeadline: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minimumAge?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUrl({}, { each: true })
  galleryImages?: string[];

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
