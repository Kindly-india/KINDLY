import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class BroadcastMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;
}
