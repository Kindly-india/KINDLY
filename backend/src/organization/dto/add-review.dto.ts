import { IsUUID, IsInt, IsString, IsOptional, Min, Max, MaxLength } from 'class-validator';

export class AddReviewDto {
  @IsUUID()
  organization_id: string;

  @IsOptional()
  @IsUUID()
  event_id?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MaxLength(1000)
  comment: string;
}
