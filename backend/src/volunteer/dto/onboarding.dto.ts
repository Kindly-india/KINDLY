import { IsString, IsArray, IsIn, ArrayMinSize } from 'class-validator';

export class OnboardingDto {
  @IsArray()
  @ArrayMinSize(3)
  @IsString({ each: true })
  interest_tags: string[];

  @IsString()
  @IsIn(['weekends', 'weekdays', 'flexible'])
  preferred_availability: string;

  @IsString()
  @IsIn(['solo', 'with_friends'])
  social_preference: string;
}
