import { TournamentCard } from '@/components/tournaments/TournamentCard';
import { getTournaments } from '@/lib/api/tournaments';
import { dynamic } from '@/lib/runtime';
import { buildPageMetadata } from '@/lib/seo';

export { dynamic };

export const metadata = buildPageMetadata({
  title: 'Tournaments',
  description: 'Browse all pigeon racing tournaments and view results.',
  path: '/tournaments',
});

export default async function TournamentsPage() {
  const tournaments = await getTournaments();

  return (
    <div className="container">
      <div className="page-hero">
        <h1>Tournaments</h1>
        <p>Explore upcoming and completed pigeon racing events across the country.</p>
      </div>

      {tournaments.length > 0 ? (
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
