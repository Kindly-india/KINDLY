import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

// Shared by the admin org-suspension and volunteer-suspension routes.
export class SetSuspensionDto {
  @IsBoolean()
  suspended: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
