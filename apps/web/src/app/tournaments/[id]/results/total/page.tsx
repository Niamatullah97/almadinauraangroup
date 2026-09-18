import { notFound } from 'next/navigation';

import { ResultPageContent } from '@/components/results/ResultPageContent';
import { LoadFailed } from '@/components/ui/LoadFailed';
import { TournamentTotalTable } from '@/components/ui/ResultCards';
import { getDailyResults, getTotalResults } from '@/lib/api/results';
import { loadTournament, loadTournamentContext } from '@/lib/api/tournaments';
import { countParticipantLofts, formatDate } from '@/lib/format';
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
    title: `${tournament.title} — Total Results`,
    description: `Total tournament results and rankings for ${tournament.title}.`,
    path: `/tournaments/${id}/results/total`,
  });
}

export default async function TotalResultsPage({ params }: Props) {
  const { id } = await params;
  const [{ tournament, raceDays, unavailable }, results] = await Promise.all([
    loadTournamentContext(id),
    getTotalResults(id),
  ]);

  if (unavailable) {
    return <LoadFailed retryHref={`/tournaments/${id}/results/total`} />;
  }

  if (!tournament) notFound();
  const dailyResults = await Promise.all(
    raceDays.map((raceDay) => getDailyResults(id, raceDay.id)),
  );
  const raceDayResults = raceDays.map((raceDay, index) => ({
    id: raceDay.id,
    label: formatDate(raceDay.raceDate),
    results: dailyResults[index],
  }));

  if (!results) {
    return <div className="empty-state">Total results are not available yet.</div>;
  }

  const loftsCount = countParticipantLofts(results.rankings.map((row) => row.participantId));

  return (
    <ResultPageContent
      title="Total Results"
      subtitle={`Combined results across ${results.raceDayCount} race day${results.raceDayCount === 1 ? '' : 's'}.`}
      summary={results.summary}
      loftsCount={loftsCount}
      firstWinner={results.firstWinner}
      lastWinner={results.lastWinner}
      averageWinner={results.averageWinner}
      rankings={results.rankings}
      rankingsContent={
        <TournamentTotalTable
          rows={results.rankings}
          raceDays={raceDayResults}
          firstWinner={results.firstWinner}
          lastWinner={results.lastWinner}
          averageWinner={results.averageWinner}
        />
      }
    />
  );
}
