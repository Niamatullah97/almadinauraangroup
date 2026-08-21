import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ParticipantDetailsDto {
  @ApiProperty({ example: 'Ahmed Khan' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'Muhammad Khan' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fatherName!: string;

  @ApiProperty({ example: '+923001234567' })
  @IsString()
  @Matches(/^[+]?[\d\s-]{7,20}$/, { message: 'Phone number format is invalid' })
  phone!: string;

  @ApiProperty({ example: 'Lahore' })
  @IsString()
  @MaxLength(120)
  city!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;

  @ApiProperty({ example: 'Sky Loft' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  loftName!: string;
}
