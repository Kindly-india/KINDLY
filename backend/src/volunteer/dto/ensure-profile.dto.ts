import { IsString, MinLength } from 'class-validator';

export class EnsureProfileDto {
  @IsString()
  @MinLength(1)
  full_name: string;
}
