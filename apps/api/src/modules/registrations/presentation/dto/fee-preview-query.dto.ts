import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FeePreviewQueryDto {
  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  pigeonCount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  excludeRegistrationId?: string;
}
