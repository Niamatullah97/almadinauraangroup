import Link from 'next/link';

import { TournamentCard } from '@/components/tournaments/TournamentCard';
import { getTournaments } from '@/lib/api/tournaments';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Home',
  description: 'Discover pigeon racing tournaments, live results, and loft rankings.',
  path: '/',
});

export default async function HomePage() {
  const tournaments = await getTournaments();
  const featured = tournaments.slice(0, 3);

  return (
    <div className="container">
      <section className="hero">
        <h1>Pigeon Racing Tournaments</h1>
        <p>
          Follow live results, explore rankings, and celebrate the fastest birds across
          Pakistan&apos;s premier loft competitions.
        </p>
        <div className="hero-actions">
          <Link href="/tournaments" className="btn btn-primary">
            Browse tournaments
          </Link>
          <Link href="/contact" className="btn btn-secondary">
            Contact us
          </Link>
        </div>
      </section>

      <section>
        <h2 className="section-title">Featured tournaments</h2>
        {featured.length > 0 ? (
          <div className="grid">
            {featured.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        ) : (
          <div className="empty-state">No tournaments available yet. Check back soon.</div>
        )}
      </section>
    </div>
  );
}
