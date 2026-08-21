export enum RegistrationPaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

export const REGISTRATION_PAYMENT_STATUS_LABELS: Record<RegistrationPaymentStatus, string> = {
  [RegistrationPaymentStatus.PENDING]: 'Pending',
  [RegistrationPaymentStatus.PARTIAL]: 'Partial',
  [RegistrationPaymentStatus.PAID]: 'Paid',
};

export interface RegistrationPaymentDto {
  id: string;
  registrationId: string;
  amount: number;
  notes: string | null;
  paidAt: string;
  createdAt: string;
}

export interface TournamentRegistrationDto {
  id: string;
  tournamentId: string;
  participantId: string;
  pigeonCount: number;
  entryFeePerPigeon: number;
  totalFee: number;
  paidAmount: number;
  paymentStatus: RegistrationPaymentStatus;
  receiptNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentRegistrationDetailDto extends TournamentRegistrationDto {
  tournament?: {
    id: string;
    title: string;
    city: string;
    entryFee: number;
  };
  participant?: {
    id: string;
    tournamentId: string;
    name: string;
    fatherName: string;
    phone: string;
    city: string;
    address: string | null;
    loftName: string;
    profileImage: string | null;
  };
  payments?: RegistrationPaymentDto[];
}

export interface RegistrationParticipantInput {
  name: string;
  fatherName: string;
  phone: string;
  city: string;
  address?: string;
  loftName: string;
}

export interface CreateRegistrationRequest {
  tournamentId: string;
  participant: RegistrationParticipantInput;
}

export interface UpdateRegistrationRequest {
  participant?: RegistrationParticipantInput;
}

export interface RecordPaymentRequest {
  amount: number;
  notes?: string;
}

export interface RegistrationListResponse {
  items: TournamentRegistrationDetailDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RegistrationQuery {
  page?: number;
  limit?: number;
  search?: string;
  tournamentId?: string;
  participantId?: string;
  paymentStatus?: RegistrationPaymentStatus;
}

export interface FeePreviewResponse {
  entryFeePerPigeon: number;
  pigeonCount: number;
  totalFee: number;
  remainingPigeonSlots: number;
}
