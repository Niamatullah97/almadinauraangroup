import { notFound } from 'next/navigation';

import { ResultPageContent } from '@/components/results/ResultPageContent';
import { RaceDayTabs } from '@/components/tournaments/RaceDayTabs';
import { getRaceDays } from '@/lib/api/race-days';
import { getDailyResults } from '@/lib/api/results';
import { getTournament } from '@/lib/api/tournaments';
import { countParticipantLofts, formatDate } from '@/lib/format';
import { buildPageMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ id: string; raceDayId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id, raceDayId } = await params;
  const [tournament, raceDays] = await Promise.all([getTournament(id), getRaceDays(id)]);
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
  const [tournament, raceDays, results] = await Promise.all([
    getTournament(id),
    getRaceDays(id),
    getDailyResults(id, raceDayId),
  ]);

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
