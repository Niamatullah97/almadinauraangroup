export enum ReportType {
  TOURNAMENT_RESULT = 'tournament-result',
  PARTICIPANT_LIST = 'participant-list',
  PAYMENTS = 'payments',
  PRIZES = 'prizes',
  LANDING_TIMES = 'landing-times',
}

export enum ReportResultScope {
  TOTAL = 'total',
  DAILY = 'daily',
  COMPLETE = 'complete',
  PARTICIPANT = 'participant',
}

export interface ReportDownloadQuery {
  tournamentId: string;
  raceDayId?: string;
  participantId?: string;
  scope?: ReportResultScope;
}

export interface PrizeDistributionRow {
  rank: number;
  participantName: string;
  loftName: string;
  prizeAmount: number;
  percentage: number;
}
