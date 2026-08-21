import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RaceDayStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateRaceDayDto {
  @ApiProperty({ example: '2026-04-02' })
  @IsDateString()
  raceDate!: string;

  @ApiProperty({ example: '06:30' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Release time must use HH:mm format' })
  releaseTime!: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'End time must use HH:mm format' })
  endTime!: string;

  @ApiProperty({ example: 'Central Loft, Lahore' })
  @IsString()
  @MaxLength(255)
  releaseLocation!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  weatherNotes?: string;

  @ApiPropertyOptional({ enum: RaceDayStatus, default: RaceDayStatus.PENDING })
  @IsOptional()
  @IsEnum(RaceDayStatus)
  status?: RaceDayStatus;
}
