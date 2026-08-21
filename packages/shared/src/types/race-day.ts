export enum RaceDayStatus {
  PENDING = 'PENDING',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
}

export const RACE_DAY_STATUS_LABELS: Record<RaceDayStatus, string> = {
  [RaceDayStatus.PENDING]: 'Pending',
  [RaceDayStatus.LIVE]: 'Live',
  [RaceDayStatus.COMPLETED]: 'Completed',
};

export interface RaceDayDto {
  id: string;
  tournamentId: string;
  raceDate: string;
  releaseTime: string;
  endTime: string;
  releaseLocation: string;
  weatherNotes: string | null;
  status: RaceDayStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRaceDayRequest {
  raceDate: string;
  releaseTime: string;
  endTime: string;
  releaseLocation: string;
  weatherNotes?: string;
  status?: RaceDayStatus;
}

export type UpdateRaceDayRequest = Partial<CreateRaceDayRequest>;
