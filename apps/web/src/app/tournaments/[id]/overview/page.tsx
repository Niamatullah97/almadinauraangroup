import { OverviewContent } from '@/components/tournaments/OverviewContent';
import { buildTournamentPageMetadata } from '@/lib/tournament-metadata';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return buildTournamentPageMetadata(id, {
    path: `/tournaments/${id}/overview`,
    fallbackTitle: 'Tournament overview',
    suffix: 'Overview',
    descriptionFor: (title) => `View ${title} details and results.`,
  });
}

export default function TournamentOverviewPage() {
  return <OverviewContent />;
}
