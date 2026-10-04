import { RaceDayStatus } from './race-day';

export interface PigeonLandingTimeDto {
  id: string;
  tournamentId: string;
  raceDayId: string;
  participantId: string;
  registrationPigeonId: string;
  landingTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface LandingTimePigeonRowDto {
  registrationId: string;
  registrationPigeonId: string;
  pigeonNumber: number;
  ringNumber: string;
  landingTimeId: string | null;
  landingTime: string | null;
  /** When this landing row was last saved. Null when the pigeon has no time yet. */
  updatedAt: string | null;
  isDoubleStamp: boolean;
  isSingleNominated: boolean;
  isPending: boolean;
}

export interface LandingTimeParticipantGroupDto {
  participantId: string;
  participantName: string;
  loftName: string;
  profileImage: string | null;
  pigeons: LandingTimePigeonRowDto[];
}

export interface LandingTimeEntrySheetResponse {
  tournamentId: string;
  raceDayId: string;
  raceDate: string;
  releaseTime: string;
  endTime: string;
  status: RaceDayStatus;
  doubleStampEnabled: boolean;
  singleNominatedEnabled: boolean;
  pigeonCount: number;
  participants: LandingTimeParticipantGroupDto[];
}

export interface CreateLandingTimeRequest {
  participantId: string;
  registrationPigeonId: string;
  landingTime: string;
  isDoubleStamp?: boolean;
  isSingleNominated?: boolean;
}

export interface UpdateLandingTimeRequest {
  landingTime: string;
  isDoubleStamp?: boolean;
  isSingleNominated?: boolean;
}

export interface BulkLandingTimeEntryRequest {
  participantId: string;
  registrationPigeonId: string;
  landingTime: string;
  isDoubleStamp?: boolean;
  isSingleNominated?: boolean;
  /** updatedAt from the sheet when it was opened. Stops an old page from overwriting a newer save. */
  loadedUpdatedAt?: string | null;
}

export interface BulkSaveLandingTimesRequest {
  entries: BulkLandingTimeEntryRequest[];
}

export interface BulkSaveLandingTimesResponse {
  saved: PigeonLandingTimeDto[];
  skipped: number;
  errors: BulkLandingTimeError[];
}

export interface BulkLandingTimeError {
  registrationPigeonId: string;
  message: string;
}

export interface LandingTimeListResponse {
  items: PigeonLandingTimeDto[];
  total: number;
}
