import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessLinkExpiryPreset } from '@kabootar/shared';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class CreateAccessLinkDto {
  @ApiProperty({ enum: AccessLinkExpiryPreset })
  @IsEnum(AccessLinkExpiryPreset)
  expiryPreset!: AccessLinkExpiryPreset;

  @ApiPropertyOptional({ description: 'Required when expiryPreset is CUSTOM' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
