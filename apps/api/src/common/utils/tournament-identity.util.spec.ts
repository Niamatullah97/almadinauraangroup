import { isUuid, liveTournamentWhere } from './tournament-identity.util';

describe('tournament identity', () => {
  it('recognizes UUID identifiers', () => {
    expect(isUuid('3d929612-6d9b-4b61-99e1-0a573348473a')).toBe(true);
    expect(isUuid('abc-group')).toBe(false);
    expect(isUuid('al-madinah-group')).toBe(false);
  });

  it('queries uuid columns only for UUID identifiers', () => {
    expect(liveTournamentWhere('3d929612-6d9b-4b61-99e1-0a573348473a')).toEqual({
      deletedAt: null,
      id: '3d929612-6d9b-4b61-99e1-0a573348473a',
    });
    expect(liveTournamentWhere('abc-group')).toEqual({
      deletedAt: null,
      slug: 'abc-group',
    });
  });
});
