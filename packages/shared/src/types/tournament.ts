export enum TournamentStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  [TournamentStatus.DRAFT]: 'Draft',
  [TournamentStatus.ACTIVE]: 'Active',
  [TournamentStatus.COMPLETED]: 'Completed',
  [TournamentStatus.CANCELLED]: 'Cancelled',
};

export interface TournamentDto {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  city: string;
  entryFee: number;
  totalPigeonsAllowed: number;
  doubleStampEnabled: boolean;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: TournamentStatus;
  bannerImage: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentCreatorDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TournamentDetailDto extends TournamentDto {
  creator?: TournamentCreatorDto;
  entryCount?: number;
}

export interface CreateTournamentRequest {
  title: string;
  description?: string;
  city: string;
  entryFee: number;
  totalPigeonsAllowed: number;
  doubleStampEnabled?: boolean;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status?: TournamentStatus;
}

export type UpdateTournamentRequest = Partial<CreateTournamentRequest>;

export interface TournamentListResponse {
  items: TournamentDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TournamentEntryDto {
  id: string;
  tournamentId: string;
  pigeonId: string;
  participantId: string;
  bibNumber: string;
  arrivalTime: string | null;
  rank: number | null;
  speedMps: number | null;
  createdAt: string;
}
