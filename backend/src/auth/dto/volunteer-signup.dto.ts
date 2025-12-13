import { IsEmail, IsNotEmpty, IsString, MinLength, IsArray, IsIn } from 'class-validator';

export class VolunteerSignupDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsIn(['Nashik', 'Mumbai', 'Pune', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata'])
  city: string;

  @IsArray()
  interests: string[];
}