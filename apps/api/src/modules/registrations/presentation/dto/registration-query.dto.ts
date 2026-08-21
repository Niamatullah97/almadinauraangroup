import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RegistrationPaymentStatus } from '@kabootar/shared';
import { Type } from 'class-transformer';

export class RegistrationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tournamentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  participantId?: string;

  @ApiPropertyOptional({ enum: RegistrationPaymentStatus })
  @IsOptional()
  @IsEnum(RegistrationPaymentStatus)
  paymentStatus?: RegistrationPaymentStatus;
}
