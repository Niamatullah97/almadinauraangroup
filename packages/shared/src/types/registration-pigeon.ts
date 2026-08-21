import { PigeonSex, PigeonStatus } from './pigeon';

export interface RegistrationPigeonDto {
  id: string;
  registrationId: string;
  tournamentId: string;
  participantId: string;
  ringNumber: string;
  pigeonNumber: number;
  color: string;
  gender: PigeonSex;
  isDoubleStamp: boolean;
  status: PigeonStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationPigeonListResponse {
  items: RegistrationPigeonDto[];
  assignedCount: number;
  registeredCount: number;
  remainingCount: number;
}

export interface CreateRegistrationPigeonRequest {
  ringNumber: string;
  pigeonNumber?: number;
  color: string;
  gender: PigeonSex;
  isDoubleStamp?: boolean;
  status?: PigeonStatus;
}

export interface UpdateRegistrationPigeonRequest {
  ringNumber?: string;
  pigeonNumber?: number;
  color?: string;
  gender?: PigeonSex;
  isDoubleStamp?: boolean;
  status?: PigeonStatus;
}

export interface BulkGeneratePigeonsRequest {
  color?: string;
  gender?: PigeonSex;
  ringPrefix?: string;
}

export interface BulkGeneratePigeonsResponse {
  created: RegistrationPigeonDto[];
  assignedCount: number;
  registeredCount: number;
  remainingCount: number;
}
