import { IsString, IsNotEmpty, IsInt, IsBoolean, IsOptional, IsIn, IsUrl, Min, IsDateString } from 'class-validator';

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
  @IsIn(['environment', 'education', 'health', 'animals', 'elderly', 'community'])
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
}