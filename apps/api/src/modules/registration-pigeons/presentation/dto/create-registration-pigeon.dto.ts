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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PigeonSex, PigeonStatus } from '@kabootar/shared';

export class CreateRegistrationPigeonDto {
  @ApiProperty({ example: 'PK-2026-001' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  ringNumber!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9999)
  pigeonNumber?: number;

  @ApiProperty({ example: 'Blue Bar' })
  @IsString()
  @MaxLength(50)
  color!: string;

  @ApiProperty({ enum: PigeonSex })
  @IsEnum(PigeonSex)
  gender!: PigeonSex;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDoubleStamp?: boolean;

  @ApiPropertyOptional({ enum: PigeonStatus })
  @IsOptional()
  @IsEnum(PigeonStatus)
  status?: PigeonStatus;
}
