import { IsIn } from 'class-validator';

export class SetApprovalDto {
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';
}
