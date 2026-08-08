import {
  IsUUID,
  IsArray,
  IsOptional,
  IsString,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';

export class AddEndorsementDto {
  @IsUUID()
  volunteer_id: string;

  @IsUUID()
  event_id: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  skills: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
