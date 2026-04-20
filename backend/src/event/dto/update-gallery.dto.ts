import { IsArray, IsString } from 'class-validator';

export class UpdateGalleryDto {
  @IsArray()
  @IsString({ each: true })
  galleryImages: string[];
}
