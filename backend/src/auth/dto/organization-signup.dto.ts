import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn, IsOptional, IsUrl } from 'class-validator';

export class OrganizationSignupDto {
  @IsString()
  @IsIn(['registered', 'supported', 'informal', 'individual'])
  orgType: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  // Registered org fields
  @IsOptional()
  @IsString()
  registrationType?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  representativeName?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  website?: string;

  // Supported org fields
  @IsOptional()
  @IsString()
  parentInstitution?: string;

  @IsOptional()
  @IsString()
  coordinatorName?: string;

  // Informal group fields
  @IsOptional()
  @IsString()
  areaLocality?: string;

  // Individual fields
  @IsOptional()
  @IsString()
  intentDescription?: string;

  // File URLs
  @IsOptional()
  @IsUrl()
  registrationCertificateUrl?: string;

  @IsOptional()
  @IsUrl()
  panCardUrl?: string;

  @IsOptional()
  @IsUrl()
  proofDocumentUrl?: string;
}