import { IsString, IsNotEmpty, IsUUID, IsArray, IsOptional, ArrayMinSize, ArrayMaxSize, IsUrl, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsUUID()
  @IsNotEmpty()
  event_id: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsUrl({}, { each: true })
  photo_urls: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}
