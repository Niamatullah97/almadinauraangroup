export interface ParticipantDto {
  id: string;
  tournamentId: string;
  name: string;
  fatherName: string;
  phone: string;
  city: string;
  address: string | null;
  loftName: string;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateParticipantRequest {
  tournamentId: string;
  name: string;
  fatherName: string;
  phone: string;
  city: string;
  address?: string;
  loftName: string;
}

export type UpdateParticipantRequest = Partial<Omit<CreateParticipantRequest, 'tournamentId'>>;

export interface ParticipantListResponse {
  items: ParticipantDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ParticipantQuery {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  tournamentId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
