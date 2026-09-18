import { notFound } from 'next/navigation';

import { ResultPageContent } from '@/components/results/ResultPageContent';
import { LoadFailed } from '@/components/ui/LoadFailed';
import { getTotalSingleNominatedResults } from '@/lib/api/results';
import { loadTournament, loadTournamentContext } from '@/lib/api/tournaments';
import { countParticipantLofts } from '@/lib/format';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const { tournament } = await loadTournament(id);

  if (!tournament) {
    return buildPageMetadata({ title: 'Results not found' });
  }

  return buildPageMetadata({
    title: `${tournament.title} — Single Nominated Results`,
    description: `Single nominated pigeon results for ${tournament.title}.`,
    path: `/tournaments/${id}/results/single-nominated`,
  });
}

export default async function SingleNominatedResultsPage({ params }: Props) {
  const { id } = await params;
  const [{ tournament, unavailable }, results] = await Promise.all([
    loadTournamentContext(id),
    getTotalSingleNominatedResults(id),
  ]);

  if (unavailable) {
    return <LoadFailed retryHref={`/tournaments/${id}/results/single-nominated`} />;
  }

  if (!tournament) notFound();

  if (!results) {
    return <div className="empty-state">Single nominated results are not available yet.</div>;
  }

  const loftsCount = countParticipantLofts(results.rankings.map((row) => row.participantId));

  return (
    <ResultPageContent
      title="Single Nominated Results"
      subtitle="Rankings for pigeons marked as single nominated across the full tournament."
      summary={results.summary}
      loftsCount={loftsCount}
      firstWinner={results.firstWinner}
      lastWinner={results.lastWinner}
      averageWinner={results.averageWinner}
      rankings={results.rankings}
      nominatedView="single-nominated"
      showWinners={false}
    />
  );
}
