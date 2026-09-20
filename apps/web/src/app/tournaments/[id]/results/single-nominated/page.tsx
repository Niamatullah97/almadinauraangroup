import { notFound } from 'next/navigation';

import { ResultPageLoader } from '@/components/results/ResultPageLoader';
import { LoadFailed } from '@/components/ui/LoadFailed';
import { loadTournament, loadTournamentContext } from '@/lib/api/tournaments';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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
    title: `${tournament.title} — Single Nominated Results`,
    description: `Single nominated pigeon results for ${tournament.title}.`,
    path: `/tournaments/${id}/results/single-nominated`,
  });
}

export default async function SingleNominatedResultsPage({ params }: Props) {
  const { id } = await params;
  const { tournament, unavailable } = await loadTournamentContext(id);

  if (unavailable) {
    return <LoadFailed retryHref={`/tournaments/${id}/results/single-nominated`} />;
  }

  if (!tournament) notFound();

  return (
    <ResultPageLoader
      variant="single-nominated"
      tournamentId={id}
      title="Single Nominated Results"
      subtitle="Rankings for pigeons marked as single nominated across the full tournament."
    />
  );
}
