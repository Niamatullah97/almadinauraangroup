import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PigeonSex } from '@kabootar/shared';

export class BulkGeneratePigeonsDto {
  @ApiPropertyOptional({ example: 'Blue Bar' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ enum: PigeonSex })
  @IsOptional()
  @IsEnum(PigeonSex)
  gender?: PigeonSex;

  @ApiPropertyOptional({ example: 'PK' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ringPrefix?: string;
}
