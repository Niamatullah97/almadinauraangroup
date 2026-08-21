import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PigeonSex } from '@prisma/client';

export class CreatePigeonDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  ringNumber!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: PigeonSex })
  @IsEnum(PigeonSex)
  sex!: PigeonSex;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  color!: string;

  @ApiProperty()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
