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
    path: `/tournaments/${id}/results/single-nominated`,
    fallbackTitle: 'Single Nominated Results',
    suffix: 'Single Nominated Results',
    descriptionFor: (title) => `Single nominated pigeon results for ${title}.`,
  });
}

export default async function SingleNominatedResultsPage({ params }: Props) {
  const { id } = await params;
  return (
    <ResultPageLoader
      variant="single-nominated"
      tournamentId={id}
      title="Single Nominated Results"
      subtitle="Rankings for pigeons marked as single nominated across the full tournament."
    />
  );
}
