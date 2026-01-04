import { IsUUID, IsArray, IsOptional, IsString } from 'class-validator';

export class AddEndorsementDto {
  @IsUUID()
  volunteer_id: string;

  @IsUUID()
  event_id: string;

  @IsArray()
  skills: string[];

  @IsOptional()
  @IsString()
  comment?: string;
}