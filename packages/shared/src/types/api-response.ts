export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  meta?: ApiMeta;
  errors?: ApiError[];
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

export interface PaginatedQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
