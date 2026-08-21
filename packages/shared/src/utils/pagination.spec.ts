import { normalizePagination } from './pagination';

describe('normalizePagination', () => {
  it('returns defaults when query is empty', () => {
    expect(normalizePagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('calculates skip from page and limit', () => {
    expect(normalizePagination({ page: 3, limit: 10 })).toEqual({
      page: 3,
      limit: 10,
      skip: 20,
    });
  });

  it('clamps invalid values', () => {
    expect(normalizePagination({ page: 0, limit: 500 })).toEqual({
      page: 1,
      limit: 100,
      skip: 0,
    });
  });
});
