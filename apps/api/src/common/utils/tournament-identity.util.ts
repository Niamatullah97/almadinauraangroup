import { Prisma } from '@prisma/client';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Look up a live tournament by UUID or public slug without sending slugs into uuid columns. */
export function liveTournamentWhere(idOrSlug: string): Prisma.TournamentWhereInput {
  return {
    deletedAt: null,
    ...(isUuid(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug }),
  };
}
