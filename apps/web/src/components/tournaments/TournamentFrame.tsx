'use client';

import { RaceDayDto, TournamentDetailDto } from '@kabootar/shared';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { TournamentPageHeader } from '@/components/tournaments/TournamentPageHeader';
import { LoadFailed } from '@/components/ui/LoadFailed';
import { getRaceDays } from '@/lib/api/race-days';
import { getTournament } from '@/lib/api/tournaments';

export interface TournamentClientState {
  tournamentId: string;
  status: 'loading' | 'error' | 'missing' | 'ready';
  tournament: TournamentDetailDto | null;
  raceDays: RaceDayDto[];
  raceDaysFailed: boolean;
  reload: () => void;
}

const TournamentClientContext = createContext<TournamentClientState | null>(null);

export function useTournamentClient(): TournamentClientState | null {
  return useContext(TournamentClientContext);
}

interface TournamentFrameProps {
  tournamentId: string;
  children: ReactNode;
}

export function TournamentFrame({ tournamentId, children }: TournamentFrameProps) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<TournamentClientState['status']>('loading');
  const [tournament, setTournament] = useState<TournamentDetailDto | null>(null);
  const [raceDays, setRaceDays] = useState<RaceDayDto[]>([]);
  const [raceDaysFailed, setRaceDaysFailed] = useState(false);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    setStatus((current) => (current === 'ready' ? current : 'loading'));

    void (async () => {
      let loadedTournament: TournamentDetailDto | null = null;
      let tournamentFailed = false;
      let loadedDays: RaceDayDto[] = [];
      let daysFailed = false;

      for (let round = 1; round <= 3; round += 1) {
        tournamentFailed = false;
        daysFailed = false;

        try {
          loadedTournament = await getTournament(tournamentId);
        } catch {
          tournamentFailed = true;
          loadedTournament = null;
        }

        try {
          loadedDays = await getRaceDays(tournamentId);
        } catch {
          daysFailed = true;
          loadedDays = [];
        }

        if (!tournamentFailed && !daysFailed) {
          break;
        }
        if (round < 3) {
          await delay((process.env.VITEST ? 0 : 250) * round);
        }
      }

      if (cancelled) {
        return;
      }

      setTournament(loadedTournament);
      setRaceDays(loadedDays);
      setRaceDaysFailed(daysFailed);

      if (loadedTournament) {
        setStatus('ready');
        return;
      }
      setStatus(tournamentFailed ? 'error' : 'missing');
    })();

    return () => {
      cancelled = true;
    };
  }, [tournamentId, attempt]);

  const value = useMemo<TournamentClientState>(
    () => ({
      tournamentId,
      status,
      tournament,
      raceDays,
      raceDaysFailed,
      reload,
    }),
    [tournamentId, status, tournament, raceDays, raceDaysFailed, reload],
  );

  return (
    <TournamentClientContext.Provider value={value}>
      {status === 'loading' && <div className="empty-state">Loading tournament…</div>}
      {status === 'error' && (
        <LoadFailed
          onRetry={reload}
          message="This tournament could not be loaded right now. Please try again."
        />
      )}
      {status === 'missing' && <div className="empty-state">Tournament not found.</div>}
      {status === 'ready' && tournament && (
        <TournamentPageHeader
          tournament={tournament}
          tournamentId={tournamentId}
          raceDays={raceDays}
        />
      )}
      {status === 'ready' && raceDaysFailed && (
        <LoadFailed
          onRetry={reload}
          message="Race days could not be loaded. Daily result tabs may be missing."
        />
      )}
      {status !== 'missing' && children}
    </TournamentClientContext.Provider>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
