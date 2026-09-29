import type { Metadata } from 'next';

import { getTournament } from '@/lib/api/tournaments';
import { buildPageMetadata } from '@/lib/seo';

/** Best-effort titles for share previews. Must never throw — Worker API misses still render. */
export async function buildTournamentPageMetadata(
  id: string,
  options: {
    path: string;
    fallbackTitle: string;
    suffix?: string;
    descriptionFor?: (title: string) => string;
  },
): Promise<Metadata> {
  try {
    const tournament = await getTournament(id);
    if (tournament) {
      const title = options.suffix ? `${tournament.title} — ${options.suffix}` : tournament.title;
      return buildPageMetadata({
        title,
        description:
          options.descriptionFor?.(tournament.title) ?? tournament.description ?? undefined,
        path: options.path,
      });
    }
  } catch {
    // Cloudflare Worker fetch failed; the browser still loads the page from the API.
  }

  return buildPageMetadata({ title: options.fallbackTitle, path: options.path });
}
