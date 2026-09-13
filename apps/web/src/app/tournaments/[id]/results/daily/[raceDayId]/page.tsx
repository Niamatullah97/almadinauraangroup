import { notFound } from 'next/navigation';

import { ResultPageContent } from '@/components/results/ResultPageContent';
import { RaceDayTabs } from '@/components/tournaments/RaceDayTabs';
import { LoadFailed } from '@/components/ui/LoadFailed';
import { getDailyResults } from '@/lib/api/results';
import { loadTournamentContext } from '@/lib/api/tournaments';
import { countParticipantLofts, formatDate } from '@/lib/format';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string; raceDayId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id, raceDayId } = await params;
  const { tournament, raceDays } = await loadTournamentContext(id);
  const raceDay = raceDays.find((day) => day.id === raceDayId);

  if (!tournament || !raceDay) {
    return buildPageMetadata({ title: 'Daily results not found' });
  }

  return buildPageMetadata({
    title: `${tournament.title} — ${formatDate(raceDay.raceDate)} Results`,
    description: `Daily race results for ${tournament.title} on ${formatDate(raceDay.raceDate)}.`,
    path: `/tournaments/${id}/results/daily/${raceDayId}`,
  });
}

export default async function DailyResultsPage({ params }: Props) {
  const { id, raceDayId } = await params;
  const [{ tournament, raceDays, unavailable }, results] = await Promise.all([
    loadTournamentContext(id),
    getDailyResults(id, raceDayId),
  ]);

  if (unavailable) {
    return (
      <div className="container" style={{ maxWidth: 1400 }}>
        <LoadFailed retryHref={`/tournaments/${id}/results/daily/${raceDayId}`} />
      </div>
    );
  }

  if (!tournament) notFound();

  const raceDay = raceDays.find((day) => day.id === raceDayId);
  if (!raceDay) notFound();

  if (!results) {
    return (
      <div className="container" style={{ maxWidth: 1400 }}>
        <RaceDayTabs
          tournamentId={id}
          raceDays={raceDays}
          activeRaceDayId={raceDayId}
          active="daily"
          doubleStampEnabled={tournament.doubleStampEnabled}
          singleNominatedEnabled={tournament.singleNominatedEnabled}
        />
        <div className="empty-state">Daily results are not available yet.</div>
      </div>
    );
  }

  const loftsCount = countParticipantLofts(results.rankings.map((row) => row.participantId));

  return (
    <div className="container" style={{ maxWidth: 1400 }}>
      <RaceDayTabs
        tournamentId={id}
        raceDays={raceDays}
        activeRaceDayId={raceDayId}
        active="daily"
        doubleStampEnabled={tournament.doubleStampEnabled}
        singleNominatedEnabled={tournament.singleNominatedEnabled}
      />
      <ResultPageContent
        title={`${tournament.title} — ${formatDate(raceDay.raceDate)} Results`}
        subtitle={`Race time ${raceDay.releaseTime} – ${raceDay.endTime}`}
        summary={results.summary}
        loftsCount={loftsCount}
        firstWinner={results.firstWinner}
        lastWinner={results.lastWinner}
        averageWinner={results.averageWinner}
        rankings={results.rankings}
      />
    </div>
  );
}
