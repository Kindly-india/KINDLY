// src/common/file-validation.util.ts
import { BadRequestException } from '@nestjs/common';

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImageFile(file: Express.Multer.File): void {
  if (!file) throw new BadRequestException('No file provided');
  
  if (file.size > MAX_FILE_SIZE_BYTES)
    throw new BadRequestException('File size must not exceed 5MB');

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype))
    throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');

  // Validate magic bytes (don't trust the mimetype header alone)
  const jpegMagic = file.buffer.slice(0, 3).toString('hex') === 'ffd8ff';
  const pngMagic  = file.buffer.slice(0, 4).toString('hex') === '89504e47';
  const webpMagic = file.buffer.slice(8, 12).toString('ascii') === 'WEBP';

  if (!jpegMagic && !pngMagic && !webpMagic)
    throw new BadRequestException('File content does not match a supported image format');
}