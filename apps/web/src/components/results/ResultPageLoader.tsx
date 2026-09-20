'use client';

import {
  DailyResultDto,
  DoubleStampResultDto,
  ParticipantResultRow,
  ResultSummaryCounts,
  ResultWinner,
  TotalResultDto,
} from '@kabootar/shared';
import { ReactNode, useEffect, useState } from 'react';

import { ResultPageContent } from '@/components/results/ResultPageContent';
import { TournamentTotalTable } from '@/components/ui/ResultCards';
import {
  getDailyResults,
  getTotalDoubleStampResults,
  getTotalResults,
  getTotalSingleNominatedResults,
} from '@/lib/api/results';
import { countParticipantLofts } from '@/lib/format';

type CommonProps = {
  tournamentId: string;
  title: string;
  subtitle?: string;
};

export type ResultPageLoaderProps = CommonProps &
  (
    | { variant: 'daily'; raceDayId: string }
    | { variant: 'total'; raceDays: Array<{ id: string; label: string }> }
    | { variant: 'double-stamp' }
    | { variant: 'single-nominated' }
  );

interface LoadedResults {
  summary: ResultSummaryCounts;
  loftsCount: number;
  firstWinner: ResultWinner | null;
  lastWinner: ResultWinner | null;
  averageWinner: ResultWinner | null;
  rankings: ParticipantResultRow[];
  showWinners: boolean;
  nominatedView?: 'double-stamp' | 'single-nominated';
  rankingsContent?: ReactNode;
}

type LoadState =
  { status: 'loading' } | { status: 'empty' } | { status: 'ready'; data: LoadedResults };

export function ResultPageLoader(props: ResultPageLoaderProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const requestKey = resultRequestKey(props);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    void (async () => {
      try {
        const data = await loadResults(props);
        if (cancelled) {
          return;
        }
        setState(data ? { status: 'ready', data } : { status: 'empty' });
      } catch {
        if (!cancelled) {
          setState({ status: 'empty' });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  if (state.status === 'loading') {
    return <div className="empty-state">Loading results…</div>;
  }

  if (state.status === 'empty') {
    return <div className="empty-state">Results are not available yet.</div>;
  }

  const { data } = state;
  return (
    <ResultPageContent
      title={props.title}
      subtitle={props.subtitle}
      summary={data.summary}
      loftsCount={data.loftsCount}
      firstWinner={data.firstWinner}
      lastWinner={data.lastWinner}
      averageWinner={data.averageWinner}
      rankings={data.rankings}
      nominatedView={data.nominatedView}
      showWinners={data.showWinners}
      rankingsContent={data.rankingsContent}
    />
  );
}

function fromResult(
  results: DailyResultDto | TotalResultDto | DoubleStampResultDto,
  extras: Partial<Pick<LoadedResults, 'showWinners' | 'nominatedView' | 'rankingsContent'>> = {},
): LoadedResults {
  return {
    summary: results.summary,
    loftsCount: countParticipantLofts(results.rankings.map((row) => row.participantId)),
    firstWinner: results.firstWinner,
    lastWinner: results.lastWinner,
    averageWinner: results.averageWinner,
    rankings: results.rankings,
    showWinners: extras.showWinners ?? true,
    nominatedView: extras.nominatedView,
    rankingsContent: extras.rankingsContent,
  };
}

function resultRequestKey(props: ResultPageLoaderProps): string {
  if (props.variant === 'daily') {
    return `${props.variant}:${props.tournamentId}:${props.raceDayId}`;
  }
  if (props.variant === 'total') {
    return `${props.variant}:${props.tournamentId}:${props.raceDays.map((day) => day.id).join(',')}`;
  }
  return `${props.variant}:${props.tournamentId}`;
}

async function loadResults(props: ResultPageLoaderProps): Promise<LoadedResults | null> {
  if (props.variant === 'daily') {
    const results = await getDailyResults(props.tournamentId, props.raceDayId);
    return results ? fromResult(results) : null;
  }

  if (props.variant === 'double-stamp') {
    const results = await getTotalDoubleStampResults(props.tournamentId);
    return results
      ? fromResult(results, { showWinners: false, nominatedView: 'double-stamp' })
      : null;
  }

  if (props.variant === 'single-nominated') {
    const results = await getTotalSingleNominatedResults(props.tournamentId);
    return results
      ? fromResult(results, { showWinners: false, nominatedView: 'single-nominated' })
      : null;
  }

  const [results, dailyResults] = await Promise.all([
    getTotalResults(props.tournamentId),
    Promise.all(props.raceDays.map((raceDay) => getDailyResults(props.tournamentId, raceDay.id))),
  ]);

  if (!results) {
    return null;
  }

  const raceDayResults = props.raceDays.map((raceDay, index) => ({
    id: raceDay.id,
    label: raceDay.label,
    results: dailyResults[index],
  }));

  return fromResult(results, {
    rankingsContent: (
      <TournamentTotalTable
        rows={results.rankings}
        raceDays={raceDayResults}
        firstWinner={results.firstWinner}
        lastWinner={results.lastWinner}
        averageWinner={results.averageWinner}
      />
    ),
  });
}
