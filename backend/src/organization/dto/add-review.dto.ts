import { IsUUID, IsInt, IsString, IsOptional, Min, Max } from 'class-validator';

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
  comment: string;
}
