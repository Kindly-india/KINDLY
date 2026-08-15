import { IsString, MinLength, MaxLength } from 'class-validator';

export class EnsureProfileDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  full_name: string;
}
