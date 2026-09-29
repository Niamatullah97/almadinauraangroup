import { ResultPageLoader } from '@/components/results/ResultPageLoader';
import { buildTournamentPageMetadata } from '@/lib/tournament-metadata';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return buildTournamentPageMetadata(id, {
    path: `/tournaments/${id}/results/double-stamp`,
    fallbackTitle: 'Double Stamp Results',
    suffix: 'Double Stamp Results',
    descriptionFor: (title) => `Double stamp pigeon results for ${title}.`,
  });
}

export default async function DoubleStampResultsPage({ params }: Props) {
  const { id } = await params;
  return (
    <ResultPageLoader
      variant="double-stamp"
      tournamentId={id}
      title="Double Stamp Results"
      subtitle="Rankings for pigeons marked as double stamp across the full tournament."
    />
  );
}
