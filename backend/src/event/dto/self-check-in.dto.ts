import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class SelfCheckInDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
