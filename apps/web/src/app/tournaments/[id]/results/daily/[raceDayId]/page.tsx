import { ResultPageLoader } from '@/components/results/ResultPageLoader';
import { buildTournamentPageMetadata } from '@/lib/tournament-metadata';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: Promise<{ id: string; raceDayId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id, raceDayId } = await params;
  return buildTournamentPageMetadata(id, {
    path: `/tournaments/${id}/results/daily/${raceDayId}`,
    fallbackTitle: 'Daily results',
    suffix: 'Daily Results',
    descriptionFor: (title) => `Daily race results for ${title}.`,
  });
}

export default async function DailyResultsPage({ params }: Props) {
  const { id, raceDayId } = await params;
  return (
    <ResultPageLoader
      variant="daily"
      tournamentId={id}
      raceDayId={raceDayId}
      title="Daily results"
    />
  );
}
