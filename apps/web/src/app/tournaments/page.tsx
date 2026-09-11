import { TournamentCard } from '@/components/tournaments/TournamentCard';
import { LoadFailed } from '@/components/ui/LoadFailed';
import { loadTournamentList } from '@/lib/api/tournaments';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Tournaments',
  description: 'Browse all pigeon racing tournaments and view results.',
  path: '/tournaments',
});

export default async function TournamentsPage() {
  const { tournaments, unavailable } = await loadTournamentList();

  return (
    <div className="container">
      <div className="page-hero">
        <h1>Tournaments</h1>
        <p>Explore upcoming and completed pigeon racing events across the country.</p>
      </div>

      {unavailable ? (
        <LoadFailed retryHref="/tournaments" />
      ) : tournaments.length > 0 ? (
        <div className="grid">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <div className="empty-state">No tournaments found.</div>
      )}
    </div>
  );
}
