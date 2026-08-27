import Link from 'next/link';
import { notFound } from 'next/navigation';

import { TournamentNav } from '@/components/tournaments/TournamentNav';
import { ResultSummary, TournamentBanner } from '@/components/ui/ResultCards';
import { getRaceDays } from '@/lib/api/race-days';
import { getTotalResults } from '@/lib/api/results';
import { getTournament } from '@/lib/api/tournaments';
import { resolveBannerUrl } from '@/lib/config';
import { countParticipantLofts, formatCurrency, formatDate, formatStatus } from '@/lib/format';
import { dynamic } from '@/lib/runtime';
import { buildPageMetadata } from '@/lib/seo';

export { dynamic };

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const tournament = await getTournament(id);

  if (!tournament) {
    return buildPageMetadata({ title: 'Tournament not found' });
  }

  return buildPageMetadata({
    title: tournament.title,
    description: tournament.description ?? `View ${tournament.title} details and results.`,
    path: `/tournaments/${id}`,
  });
}

export default async function TournamentDetailPage({ params }: Props) {
  const { id } = await params;
  const [tournament, results, raceDays] = await Promise.all([
    getTournament(id),
    getTotalResults(id),
    getRaceDays(id),
  ]);

  if (!tournament) notFound();

  const bannerUrl = resolveBannerUrl(tournament.bannerImage);
  const loftsCount = results
    ? countParticipantLofts(results.rankings.map((row) => row.participantId))
    : undefined;

  return (
    <div className="container">
      <TournamentBanner title={tournament.title} bannerUrl={bannerUrl} />

      <div className="page-hero">
        <h1>{tournament.title}</h1>
        {tournament.description && <p>{tournament.description}</p>}
      </div>

      <TournamentNav
        tournamentId={id}
        active="overview"
        raceDayId={raceDays[0]?.id}
        doubleStampEnabled={tournament.doubleStampEnabled}
      />

      <div className="meta-row" style={{ marginBottom: '1.5rem' }}>
        <span>{tournament.city}</span>
        <span>
          {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
        </span>
        <span>
          {tournament.startTime} – {tournament.endTime}
        </span>
        <span>{formatCurrency(tournament.entryFee)} entry</span>
        <span>{tournament.totalPigeonsAllowed} pigeon slots</span>
        <span className="badge">{formatStatus(tournament.status)}</span>
      </div>

      {results && (
        <>
          <h2 className="section-title">Tournament stats</h2>
          <ResultSummary summary={results.summary} loftsCount={loftsCount} />
        </>
      )}

      <h2 className="section-title">Results</h2>
      <div className="grid">
        <Link href={`/tournaments/${id}/results/total`} className="card link-card">
          <h3>Total results</h3>
          <p style={{ color: 'var(--color-muted)' }}>Overall rankings across all race days.</p>
        </Link>
        {tournament.doubleStampEnabled && (
          <Link href={`/tournaments/${id}/results/double-stamp`} className="card link-card">
            <h3>Double stamp results</h3>
            <p style={{ color: 'var(--color-muted)' }}>Rankings for double-stamp pigeons only.</p>
          </Link>
        )}
        {raceDays.length > 0 && (
          <Link
            href={`/tournaments/${id}/results/daily/${raceDays[0].id}`}
            className="card link-card"
          >
            <h3>Daily results</h3>
            <p style={{ color: 'var(--color-muted)' }}>
              {raceDays.length} race day{raceDays.length === 1 ? '' : 's'} available.
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
