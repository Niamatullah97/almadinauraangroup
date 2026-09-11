import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateLandingTimeDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSingleNominated?: boolean;
}
