import { IsArray, IsUrl, ArrayMaxSize } from 'class-validator';

export class UpdateGalleryDto {
  @IsArray()
  @ArrayMaxSize(20)
  @IsUrl({}, { each: true })
  galleryImages: string[];
}
