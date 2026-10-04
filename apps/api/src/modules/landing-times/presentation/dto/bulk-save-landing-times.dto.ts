import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class BulkLandingTimeEntryDto {
  @ApiProperty()
  @IsUUID()
  participantId!: string;

  @ApiProperty()
  @IsUUID()
  registrationPigeonId!: string;

  @ApiPropertyOptional({ example: '14:35:22' })
  @ValidateIf((entry: BulkLandingTimeEntryDto) => !entry.clear)
  @IsString()
  @Matches(/^(\d{2}:\d{2}(:\d{2})?|.+T.+)$/, {
    message: 'Landing time must be HH:mm, HH:mm:ss, or ISO datetime',
  })
  landingTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDoubleStamp?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSingleNominated?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  clear?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  loadedUpdatedAt?: string | null;
}

export class BulkSaveLandingTimesDto {
  @ApiProperty({ type: [BulkLandingTimeEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkLandingTimeEntryDto)
  entries!: BulkLandingTimeEntryDto[];
}
