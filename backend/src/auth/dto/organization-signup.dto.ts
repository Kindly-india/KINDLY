import { IsEmail, IsNotEmpty, IsString, IsIn, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class OrganizationSignupDto {
  @IsString()
  @IsIn(['registered', 'supported', 'informal', 'individual'])
  orgType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  // Registered org fields
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  representativeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string;

  @IsOptional()
  @IsUrl({ require_protocol: false })
  website?: string;

  // Supported org fields
  @IsOptional()
  @IsString()
  @MaxLength(100)
  parentInstitution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  coordinatorName?: string;

  // Informal group fields
  @IsOptional()
  @IsString()
  @MaxLength(300)
  areaLocality?: string;

  // Individual fields
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  intentDescription?: string;

  // KYC document storage PATHS (not URLs) — the bucket is private, so we store
  // the object path and hand out signed URLs to admins on demand.
  @IsOptional()
  @IsString()
  @MaxLength(300)
  registrationCertificateUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  panCardUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  proofDocumentUrl?: string;
}
