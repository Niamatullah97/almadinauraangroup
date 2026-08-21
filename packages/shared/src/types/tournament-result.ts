export interface RacingWindow {
  startTime: string;
  endTime: string;
}

export interface ResultPigeonLandingInput {
  registrationPigeonId: string;
  participantId: string;
  participantName: string;
  loftName: string;
  pigeonNumber: number;
  ringNumber: string;
  isDoubleStamp: boolean;
  landingTime: Date | null;
  calculatedDurationMs?: number | null;
  profileImage?: string | null;
}

export interface ResultRaceDayInput {
  raceDayId: string;
  raceDate: string;
  releaseTime: string;
  endTime: string;
  status?: string;
}

export interface ResultCalculationOptions {
  now?: Date;
  totalPigeonsAllowed?: number;
  raceEnded?: boolean;
}

export interface ResultPigeonRow {
  registrationPigeonId: string;
  participantId: string;
  pigeonNumber: number;
  ringNumber: string;
  isDoubleStamp: boolean;
  isBrave: boolean;
  landingTimeMs: number | null;
  landingClockTime: string | null;
}

export interface ParticipantResultRow {
  participantId: string;
  participantName: string;
  loftName: string;
  profileImage?: string | null;
  rank: number | null;
  totalPigeons: number;
  landedPigeons: number;
  remainingPigeons: number;
  totalLandingTimeMs: number;
  averageLandingTimeMs: number | null;
  currentFlyingTimeMs: number | null;
  pigeons: ResultPigeonRow[];
}

export interface ResultWinner {
  participantId: string;
  participantName: string;
  loftName: string;
  profileImage?: string | null;
  registrationPigeonId?: string;
  pigeonNumber?: number;
  ringNumber?: string;
  valueMs: number;
  landingClockTime?: string | null;
  category: 'first' | 'last' | 'average' | 'brave';
}

export interface ResultSummaryCounts {
  totalPigeons: number;
  landedPigeons: number;
  remainingPigeons: number;
}

export interface DailyResultDto {
  raceDayId: string;
  raceDate: string;
  releaseTime: string;
  summary: ResultSummaryCounts;
  firstWinner: ResultWinner | null;
  lastWinner: ResultWinner | null;
  averageWinner: ResultWinner | null;
  bravePigeon: ResultWinner | null;
  rankings: ParticipantResultRow[];
}

export interface TotalResultDto {
  tournamentId: string;
  raceDayCount: number;
  summary: ResultSummaryCounts;
  firstWinner: ResultWinner | null;
  lastWinner: ResultWinner | null;
  averageWinner: ResultWinner | null;
  bravePigeon: ResultWinner | null;
  rankings: ParticipantResultRow[];
}

export interface TournamentResultInput {
  tournamentId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalPigeonsAllowed: number;
  status?: string;
  raceDays: ResultRaceDayInput[];
  pigeons: TournamentResultPigeonInput[];
}

export interface TournamentResultPigeonInput {
  registrationPigeonId: string;
  participantId: string;
  participantName: string;
  loftName: string;
  pigeonNumber: number;
  ringNumber: string;
  isDoubleStamp: boolean;
  profileImage?: string | null;
  landings: Array<{
    raceDayId: string;
    landingTime: Date;
  }>;
}

export interface DoubleStampResultDto {
  scope: 'daily' | 'total';
  raceDayId?: string;
  summary: ResultSummaryCounts;
  firstWinner: ResultWinner | null;
  lastWinner: ResultWinner | null;
  averageWinner: ResultWinner | null;
  bravePigeon: ResultWinner | null;
  rankings: ParticipantResultRow[];
}
