import { notFound } from 'next/navigation';

import { ResultPageContent } from '@/components/results/ResultPageContent';
import { RaceDayTabs } from '@/components/tournaments/RaceDayTabs';
import { getRaceDays } from '@/lib/api/race-days';
import { getTotalDoubleStampResults } from '@/lib/api/results';
import { getTournament } from '@/lib/api/tournaments';
import { countParticipantLofts } from '@/lib/format';
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
    title: `${tournament.title} — Double Stamp Results`,
    description: `Double stamp pigeon results for ${tournament.title}.`,
    path: `/tournaments/${id}/results/double-stamp`,
  });
}

export default async function DoubleStampResultsPage({ params }: Props) {
  const { id } = await params;
  const [tournament, results, raceDays] = await Promise.all([
    getTournament(id),
    getTotalDoubleStampResults(id),
    getRaceDays(id),
  ]);

  if (!tournament) notFound();

  if (!results) {
    return (
      <div className="container" style={{ maxWidth: 1400 }}>
        <RaceDayTabs
          tournamentId={id}
          raceDays={raceDays}
          active="double-stamp"
          doubleStampEnabled={tournament.doubleStampEnabled}
        />
        <div className="empty-state">Double stamp results are not available yet.</div>
      </div>
    );
  }

  const loftsCount = countParticipantLofts(results.rankings.map((row) => row.participantId));

  return (
    <div className="container" style={{ maxWidth: 1400 }}>
      <RaceDayTabs
        tournamentId={id}
        raceDays={raceDays}
        active="double-stamp"
        doubleStampEnabled={tournament.doubleStampEnabled}
      />
      <ResultPageContent
        title={`${tournament.title} — Double Stamp Results`}
        subtitle="Rankings for pigeons marked as double stamp across the full tournament."
        summary={results.summary}
        loftsCount={loftsCount}
        firstWinner={results.firstWinner}
        lastWinner={results.lastWinner}
        averageWinner={results.averageWinner}
        rankings={results.rankings}
        compactPigeonColumns
      />
    </div>
  );
}
