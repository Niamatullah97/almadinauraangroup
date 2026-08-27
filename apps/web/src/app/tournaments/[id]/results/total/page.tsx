import { notFound } from 'next/navigation';

import { ResultPageContent } from '@/components/results/ResultPageContent';
import { RaceDayTabs } from '@/components/tournaments/RaceDayTabs';
import { TournamentTotalTable } from '@/components/ui/ResultCards';
import { getRaceDays } from '@/lib/api/race-days';
import { getDailyResults, getTotalResults } from '@/lib/api/results';
import { getTournament } from '@/lib/api/tournaments';
import { countParticipantLofts, formatDate } from '@/lib/format';
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
  const [tournament, results, raceDays] = await Promise.all([
    getTournament(id),
    getTotalResults(id),
    getRaceDays(id),
  ]);

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
    return (
      <div className="container" style={{ maxWidth: 1400 }}>
        <RaceDayTabs
          tournamentId={id}
          raceDays={raceDays}
          active="total"
          doubleStampEnabled={tournament.doubleStampEnabled}
        />
        <div className="empty-state">Total results are not available yet.</div>
      </div>
    );
  }

  const loftsCount = countParticipantLofts(results.rankings.map((row) => row.participantId));

  return (
    <div className="container" style={{ maxWidth: 1400 }}>
      <RaceDayTabs
        tournamentId={id}
        raceDays={raceDays}
        active="total"
        doubleStampEnabled={tournament.doubleStampEnabled}
      />
      <ResultPageContent
        title={`${tournament.title} — Total Results`}
        subtitle={`Combined results across ${results.raceDayCount} race day${results.raceDayCount === 1 ? '' : 's'}.`}
        summary={results.summary}
        loftsCount={loftsCount}
        firstWinner={results.firstWinner}
        lastWinner={results.lastWinner}
        averageWinner={results.averageWinner}
        rankings={results.rankings}
        rankingsContent={<TournamentTotalTable rows={results.rankings} raceDays={raceDayResults} />}
      />
    </div>
  );
}
