import Link from 'next/link';
import { notFound } from 'next/navigation';

import { LoadFailed } from '@/components/ui/LoadFailed';
import { ResultSummary } from '@/components/ui/ResultCards';
import { getTotalResults } from '@/lib/api/results';
import { loadTournament, loadTournamentContext } from '@/lib/api/tournaments';
import { countParticipantLofts, formatCurrency, formatDate, formatStatus } from '@/lib/format';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const { tournament } = await loadTournament(id);

  if (!tournament) {
    return buildPageMetadata({ title: 'Tournament not found' });
  }

  return buildPageMetadata({
    title: `${tournament.title} — Overview`,
    description: tournament.description ?? `View ${tournament.title} details and results.`,
    path: `/tournaments/${id}/overview`,
  });
}

export default async function TournamentOverviewPage({ params }: Props) {
  const { id } = await params;
  const [{ tournament, raceDays, unavailable }, results] = await Promise.all([
    loadTournamentContext(id),
    getTotalResults(id),
  ]);

  if (unavailable) {
    return <LoadFailed retryHref={`/tournaments/${id}/overview`} />;
  }

  if (!tournament) notFound();

  const loftsCount = results
    ? countParticipantLofts(results.rankings.map((row) => row.participantId))
    : undefined;

  return (
    <>
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
        {tournament.singleNominatedEnabled && (
          <Link href={`/tournaments/${id}/results/single-nominated`} className="card link-card">
            <h3>Single nominated results</h3>
            <p style={{ color: 'var(--color-muted)' }}>
              Rankings for single nominated pigeons only.
            </p>
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
    </>
  );
}
