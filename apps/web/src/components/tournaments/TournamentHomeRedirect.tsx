'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useTournamentClient } from '@/components/tournaments/TournamentFrame';
import { pickDefaultRaceDay } from '@/lib/default-race-day';

interface TournamentHomeRedirectProps {
  tournamentId: string;
}

export function TournamentHomeRedirect({ tournamentId }: TournamentHomeRedirectProps) {
  const router = useRouter();
  const ctx = useTournamentClient();

  const status = ctx?.status;
  const raceDaysFailed = ctx?.raceDaysFailed ?? false;
  const raceDays = ctx?.raceDays;

  useEffect(() => {
    if (status !== 'ready' || raceDaysFailed || !raceDays) {
      return;
    }

    const defaultRaceDay = pickDefaultRaceDay(raceDays);
    router.replace(
      defaultRaceDay
        ? `/tournaments/${tournamentId}/results/daily/${defaultRaceDay.id}`
        : `/tournaments/${tournamentId}/results/total`,
    );
  }, [status, raceDaysFailed, raceDays, router, tournamentId]);

  if (!ctx || status === 'loading' || status === 'error' || raceDaysFailed) {
    return null;
  }

  return <div className="empty-state">Opening today’s results…</div>;
}
