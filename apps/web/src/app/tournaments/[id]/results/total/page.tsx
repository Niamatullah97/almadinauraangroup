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
    path: `/tournaments/${id}/results/total`,
    fallbackTitle: 'Total Results',
    suffix: 'Total Results',
    descriptionFor: (title) => `Total tournament results and rankings for ${title}.`,
  });
}

export default async function TotalResultsPage({ params }: Props) {
  const { id } = await params;
  return <ResultPageLoader variant="total" tournamentId={id} title="Total Results" />;
}
