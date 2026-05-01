import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn, IsUrl, MaxLength } from 'class-validator';

export class SaveSearchHistoryDto {
  @IsUUID()
  result_id: string;

  @IsString()
  @IsIn(['volunteer', 'organization'])
  result_type: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  result_name: string;

  @IsOptional()
  @IsUrl()
  result_image?: string;
}
