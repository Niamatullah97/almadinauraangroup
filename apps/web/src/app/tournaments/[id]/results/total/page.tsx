import { notFound } from 'next/navigation';

import { ResultPageLoader } from '@/components/results/ResultPageLoader';
import { LoadFailed } from '@/components/ui/LoadFailed';
import { loadTournament, loadTournamentContext } from '@/lib/api/tournaments';
import { formatDate } from '@/lib/format';
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
    title: `${tournament.title} — Total Results`,
    description: `Total tournament results and rankings for ${tournament.title}.`,
    path: `/tournaments/${id}/results/total`,
  });
}

export default async function TotalResultsPage({ params }: Props) {
  const { id } = await params;
  const { tournament, raceDays, unavailable } = await loadTournamentContext(id);

  if (unavailable) {
    return <LoadFailed retryHref={`/tournaments/${id}/results/total`} />;
  }

  if (!tournament) notFound();

  return (
    <ResultPageLoader
      variant="total"
      tournamentId={id}
      title="Total Results"
      subtitle={`Combined results across ${raceDays.length} race day${raceDays.length === 1 ? '' : 's'}.`}
      raceDays={raceDays.map((raceDay) => ({
        id: raceDay.id,
        label: formatDate(raceDay.raceDate),
      }))}
    />
  );
}
