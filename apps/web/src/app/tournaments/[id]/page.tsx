import { TournamentHomeRedirect } from '@/components/tournaments/TournamentHomeRedirect';
import { buildTournamentPageMetadata } from '@/lib/tournament-metadata';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return buildTournamentPageMetadata(id, {
    path: `/tournaments/${id}`,
    fallbackTitle: 'Tournament',
    descriptionFor: (title) => `View ${title} details and results.`,
  });
}

export default async function TournamentDetailPage({ params }: Props) {
  const { id } = await params;
  return <TournamentHomeRedirect tournamentId={id} />;
}
