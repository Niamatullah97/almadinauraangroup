import { ReactNode } from 'react';

import { TournamentPageHeader } from '@/components/tournaments/TournamentPageHeader';
import { LoadFailed } from '@/components/ui/LoadFailed';
import { loadTournamentContext } from '@/lib/api/tournaments';

export const dynamic = 'force-dynamic';

interface Props {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default async function TournamentLayout({ children, params }: Props) {
  const { id } = await params;
  const { tournament, raceDays, unavailable } = await loadTournamentContext(id);

  if (unavailable) {
    return (
      <div className="container" style={{ maxWidth: 1400 }}>
        <LoadFailed retryHref={`/tournaments/${id}/results/total`} />
      </div>
    );
  }

  if (!tournament) {
    return <>{children}</>;
  }

  return (
    <div className="container" style={{ maxWidth: 1400 }}>
      <TournamentPageHeader tournament={tournament} tournamentId={id} raceDays={raceDays} />
      {children}
    </div>
  );
}
