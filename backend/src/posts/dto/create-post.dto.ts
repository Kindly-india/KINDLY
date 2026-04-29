import { IsString, IsNotEmpty, IsUUID, IsArray, IsOptional, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CreatePostDto {
  @IsUUID()
  @IsNotEmpty()
  event_id: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  photo_urls: string[];

  @IsOptional()
  @IsString()
  caption?: string;
}
