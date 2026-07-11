import { IsString, IsOptional, MaxLength } from 'class-validator';

export class MarkBillPaidDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  paidReference?: string;
}
