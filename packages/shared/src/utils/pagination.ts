import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../constants/api';
import { PaginatedQuery } from '../types/api-response';

export function normalizePagination(query: PaginatedQuery) {
  const page = Math.max(1, query.page ?? DEFAULT_PAGE);
  const limit = Math.min(100, Math.max(1, query.limit ?? DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
