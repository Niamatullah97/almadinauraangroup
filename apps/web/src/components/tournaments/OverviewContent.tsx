'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useTournamentClient } from '@/components/tournaments/TournamentFrame';
import { ResultSummary } from '@/components/ui/ResultCards';
import { getTotalResults } from '@/lib/api/results';
import { pickDefaultRaceDay } from '@/lib/default-race-day';
import { countParticipantLofts, formatCurrency, formatDate, formatStatus } from '@/lib/format';

interface OverviewStats {
  totalPigeons: number;
  landedPigeons: number;
  remainingPigeons: number;
  loftsCount: number;
}

export function OverviewContent() {
  const ctx = useTournamentClient();
  const [stats, setStats] = useState<OverviewStats | null>(null);

  const tournamentId = ctx?.tournamentId;
  const tournament = ctx?.tournament;

  useEffect(() => {
    if (!tournamentId || ctx?.status !== 'ready') {
      return;
    }

    let cancelled = false;
    void (async () => {
      const results = await getTotalResults(tournamentId);
      if (cancelled || !results) {
        return;
      }
      setStats({
        ...results.summary,
        loftsCount: countParticipantLofts(results.rankings.map((row) => row.participantId)),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [ctx?.status, tournamentId]);

  if (!ctx || ctx.status === 'loading' || ctx.status === 'error') {
    return null;
  }

  if (ctx.status === 'missing' || !tournament) {
    return null;
  }

  const defaultRaceDay = pickDefaultRaceDay(ctx.raceDays);

  return (
    <>
      <div className="meta-row" style={{ marginBottom: '1.5rem' }}>
        <span>{tournament.city}</span>
        <span>
          {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
        </span>
        <span>
          {tournament.startTime} – {tournament.endTime}
        </span>
        <span>{formatCurrency(tournament.entryFee)} entry</span>
        <span>{tournament.totalPigeonsAllowed} pigeon slots</span>
        <span className="badge">{formatStatus(tournament.status)}</span>
      </div>

      {stats && (
        <>
          <h2 className="section-title">Tournament stats</h2>
          <ResultSummary summary={stats} loftsCount={stats.loftsCount} />
        </>
      )}

      <h2 className="section-title">Results</h2>
      <div className="grid">
        <Link href={`/tournaments/${tournamentId}/results/total`} className="card link-card">
          <h3>Total results</h3>
          <p style={{ color: 'var(--color-muted)' }}>Overall rankings across all race days.</p>
        </Link>
        {tournament.doubleStampEnabled && (
          <Link
            href={`/tournaments/${tournamentId}/results/double-stamp`}
            className="card link-card"
          >
            <h3>Double stamp results</h3>
            <p style={{ color: 'var(--color-muted)' }}>Rankings for double-stamp pigeons only.</p>
          </Link>
        )}
        {tournament.singleNominatedEnabled && (
          <Link
            href={`/tournaments/${tournamentId}/results/single-nominated`}
            className="card link-card"
          >
            <h3>Single nominated results</h3>
            <p style={{ color: 'var(--color-muted)' }}>
              Rankings for pigeons marked as single nominated only.
            </p>
          </Link>
        )}
        {defaultRaceDay && (
          <Link
            href={`/tournaments/${tournamentId}/results/daily/${defaultRaceDay.id}`}
            className="card link-card"
          >
            <h3>Daily results</h3>
            <p style={{ color: 'var(--color-muted)' }}>
              {ctx.raceDays.length} race day{ctx.raceDays.length === 1 ? '' : 's'} available.
            </p>
          </Link>
        )}
      </div>
    </>
  );
}
