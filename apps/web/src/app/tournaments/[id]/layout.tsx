import { ReactNode } from 'react';

import { TournamentFrame } from '@/components/tournaments/TournamentFrame';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default async function TournamentLayout({ children, params }: Props) {
  const { id } = await params;

  return (
    <div className="container" style={{ maxWidth: 1400 }}>
      <TournamentFrame tournamentId={id}>{children}</TournamentFrame>
    </div>
  );
}
