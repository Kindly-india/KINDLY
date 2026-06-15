import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class SelfCheckInDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
