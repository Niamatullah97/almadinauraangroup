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
  registrationPigeonId: string;
  pigeonNumber: number;
  ringNumber: string;
  landingTimeId: string | null;
  landingTime: string | null;
  isDoubleStamp: boolean;
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
  pigeonCount: number;
  participants: LandingTimeParticipantGroupDto[];
}

export interface CreateLandingTimeRequest {
  participantId: string;
  registrationPigeonId: string;
  landingTime: string;
  isDoubleStamp?: boolean;
}

export interface UpdateLandingTimeRequest {
  landingTime: string;
  isDoubleStamp?: boolean;
}

export interface BulkLandingTimeEntryRequest {
  participantId: string;
  registrationPigeonId: string;
  landingTime: string;
  isDoubleStamp?: boolean;
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
