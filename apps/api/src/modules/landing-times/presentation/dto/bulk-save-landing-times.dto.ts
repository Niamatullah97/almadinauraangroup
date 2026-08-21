import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkLandingTimeEntryDto {
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

export class BulkSaveLandingTimesDto {
  @ApiProperty({ type: [BulkLandingTimeEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkLandingTimeEntryDto)
  entries!: BulkLandingTimeEntryDto[];
}
