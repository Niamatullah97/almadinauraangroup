import { TournamentDetailDto } from './tournament';

export enum AccessLinkExpiryPreset {
  TODAY = 'TODAY',
  TOMORROW = 'TOMORROW',
  DAYS_7 = 'DAYS_7',
  MONTH = 'MONTH',
  CUSTOM = 'CUSTOM',
}

export const ACCESS_LINK_EXPIRY_LABELS: Record<AccessLinkExpiryPreset, string> = {
  [AccessLinkExpiryPreset.TODAY]: 'Today',
  [AccessLinkExpiryPreset.TOMORROW]: 'Tomorrow',
  [AccessLinkExpiryPreset.DAYS_7]: 'Next 7 days',
  [AccessLinkExpiryPreset.MONTH]: '1 month',
  [AccessLinkExpiryPreset.CUSTOM]: 'Custom date',
};

export interface TournamentAccessLinkDto {
  id: string;
  tournamentId: string;
  token: string;
  accessUrl: string;
  expiryPreset: AccessLinkExpiryPreset;
  expiresAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  isExpired: boolean;
  isRevoked: boolean;
  isActive: boolean;
}

export interface CreatedTournamentAccessLinkDto extends TournamentAccessLinkDto {
  secretKey: string;
}

export interface CreateAccessLinkRequest {
  expiryPreset: AccessLinkExpiryPreset;
  expiresAt?: string;
}

export interface UnlockOrganizerRequest {
  token: string;
  secretKey: string;
}

export interface OrganizerUnlockResponse {
  accessToken: string;
  expiresAt: string;
  token: string;
  tournament: TournamentDetailDto;
}

export interface TournamentAccessLinkListResponse {
  items: TournamentAccessLinkDto[];
  total: number;
}
