import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

function blankToNull(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export class ParticipantDetailsDto {
  @ApiProperty({ example: 'Ahmed Khan' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'Muhammad Khan' })
  @Transform(({ value }) => blankToNull(value))
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fatherName?: string | null;

  @ApiPropertyOptional({ example: '+923001234567' })
  @Transform(({ value }) => blankToNull(value))
  @IsOptional()
  @IsString()
  @Matches(/^[+]?[\d\s-]{7,20}$/, { message: 'Phone number format is invalid' })
  phone?: string | null;

  @ApiPropertyOptional({ example: 'Lahore' })
  @Transform(({ value }) => blankToNull(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;

  @ApiPropertyOptional({ example: 'Ahmed Khan' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  loftName?: string;
}
