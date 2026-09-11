import { PigeonSex, PigeonStatus } from '@kabootar/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateRegistrationPigeonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  ringNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9999)
  pigeonNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ enum: PigeonSex })
  @IsOptional()
  @IsEnum(PigeonSex)
  gender?: PigeonSex;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDoubleStamp?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSingleNominated?: boolean;

  @ApiPropertyOptional({ enum: PigeonStatus })
  @IsOptional()
  @IsEnum(PigeonStatus)
  status?: PigeonStatus;
}
