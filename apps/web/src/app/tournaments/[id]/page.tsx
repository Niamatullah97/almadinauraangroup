import { notFound, redirect } from 'next/navigation';

import { LoadFailed } from '@/components/ui/LoadFailed';
import { loadTournament, loadTournamentContext } from '@/lib/api/tournaments';
import { pickDefaultRaceDay } from '@/lib/default-race-day';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const { tournament } = await loadTournament(id);

  if (!tournament) {
    return buildPageMetadata({ title: 'Tournament not found' });
  }

  return buildPageMetadata({
    title: tournament.title,
    description: tournament.description ?? `View ${tournament.title} details and results.`,
    path: `/tournaments/${id}`,
  });
}

export default async function TournamentDetailPage({ params }: Props) {
  const { id } = await params;
  const { tournament, raceDays, unavailable } = await loadTournamentContext(id);

  if (unavailable) {
    return <LoadFailed retryHref={`/tournaments/${id}`} />;
  }

  if (!tournament) notFound();

  const defaultRaceDay = pickDefaultRaceDay(raceDays);
  if (defaultRaceDay) {
    redirect(`/tournaments/${id}/results/daily/${defaultRaceDay.id}`);
  }

  redirect(`/tournaments/${id}/results/total`);
}
