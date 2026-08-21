import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentStatus } from '@prisma/client';

@ValidatorConstraint({ name: 'EndDateAfterStartDate', async: false })
class EndDateAfterStartDate implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments): boolean {
    const obj = args.object as CreateTournamentDto;
    if (!obj.startDate || !endDate) return true;
    return new Date(endDate) >= new Date(obj.startDate);
  }

  defaultMessage(): string {
    return 'End date must be on or after start date';
  }
}

@ValidatorConstraint({ name: 'EndTimeAfterStartTime', async: false })
class EndTimeAfterStartTime implements ValidatorConstraintInterface {
  validate(endTime: string, args: ValidationArguments): boolean {
    const obj = args.object as CreateTournamentDto;
    if (!obj.startTime || !endTime) return true;
    return endTime > obj.startTime;
  }

  defaultMessage(): string {
    return 'End time must be after start time';
  }
}

export class CreateTournamentDto {
  @ApiProperty({ example: 'Spring Classic 2026' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: 'Lahore' })
  @IsString()
  @MaxLength(120)
  city!: string;

  @ApiProperty({ example: 500 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  entryFee!: number;

  @ApiProperty({
    example: 11,
    description: 'Number of pigeons each participant competes with (Pigeon 1 through N)',
  })
  @IsInt()
  @Min(1)
  totalPigeonsAllowed!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  doubleStampEnabled?: boolean;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-04-03' })
  @IsDateString()
  @Validate(EndDateAfterStartDate)
  endDate!: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Start time must use HH:mm format' })
  startTime!: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'End time must use HH:mm format' })
  @Validate(EndTimeAfterStartTime)
  endTime!: string;

  @ApiPropertyOptional({ enum: TournamentStatus, default: TournamentStatus.DRAFT })
  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;
}
