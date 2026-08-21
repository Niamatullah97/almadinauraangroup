import { ReportResultScope } from '@kabootar/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class TournamentResultReportQueryDto {
  @ApiPropertyOptional({ enum: ReportResultScope, default: ReportResultScope.COMPLETE })
  @IsOptional()
  @IsEnum(ReportResultScope)
  scope: ReportResultScope = ReportResultScope.COMPLETE;

  @ApiPropertyOptional()
  @ValidateIf((query) => query.scope === ReportResultScope.DAILY)
  @IsUUID()
  raceDayId?: string;

  @ApiPropertyOptional()
  @ValidateIf((query) => query.scope === ReportResultScope.PARTICIPANT)
  @IsUUID()
  participantId?: string;
}

export class LandingTimeReportQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  raceDayId!: string;
}
