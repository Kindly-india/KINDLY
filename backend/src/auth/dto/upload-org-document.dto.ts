import { IsIn, IsString } from 'class-validator';

export class UploadOrgDocumentDto {
  @IsString()
  @IsIn(['registered', 'supported', 'informal', 'individual'])
  orgType: string;
}
