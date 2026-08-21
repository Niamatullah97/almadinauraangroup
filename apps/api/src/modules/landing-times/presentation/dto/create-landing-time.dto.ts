import { IsBoolean, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLandingTimeDto {
  @ApiProperty()
  @IsUUID()
  participantId!: string;

  @ApiProperty()
  @IsUUID()
  registrationPigeonId!: string;

  @ApiProperty({ example: '14:35:22' })
  @IsString()
  @Matches(/^(\d{2}:\d{2}(:\d{2})?|.+T.+)$/, {
    message: 'Landing time must be HH:mm, HH:mm:ss, or ISO datetime',
  })
  landingTime!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDoubleStamp?: boolean;
}
