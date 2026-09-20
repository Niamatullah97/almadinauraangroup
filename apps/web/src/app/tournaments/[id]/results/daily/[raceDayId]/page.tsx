import { notFound } from 'next/navigation';

import { ResultPageLoader } from '@/components/results/ResultPageLoader';
import { LoadFailed } from '@/components/ui/LoadFailed';
import { loadTournamentContext } from '@/lib/api/tournaments';
import { formatDate } from '@/lib/format';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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
  const { tournament, raceDays, unavailable } = await loadTournamentContext(id);

  if (unavailable) {
    return <LoadFailed retryHref={`/tournaments/${id}/results/daily/${raceDayId}`} />;
  }

  if (!tournament) notFound();

  const raceDay = raceDays.find((day) => day.id === raceDayId);
  if (!raceDay) notFound();

  return (
    <ResultPageLoader
      variant="daily"
      tournamentId={id}
      raceDayId={raceDayId}
      title={`${formatDate(raceDay.raceDate)} Results`}
      subtitle={`Race time ${raceDay.releaseTime} – ${raceDay.endTime}`}
    />
  );
}
