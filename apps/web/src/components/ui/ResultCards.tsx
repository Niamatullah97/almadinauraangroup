import {
  DailyResultDto,
  formatClockDuration,
  formatWinnerValue,
  ParticipantResultRow,
  ResultPigeonRow,
  ResultSummaryCounts,
  ResultWinner,
} from '@kabootar/shared';

import { resolveBannerUrl } from '@/lib/config';

interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
    </div>
  );
}

interface ResultSummaryProps {
  summary: ResultSummaryCounts;
  loftsCount?: number;
}

export function ResultSummary({ summary, loftsCount }: ResultSummaryProps) {
  return (
    <div className="stats-grid">
      {loftsCount !== undefined && <StatCard label="Lofts" value={loftsCount} />}
      <StatCard label="Total pigeons" value={summary.totalPigeons} />
      <StatCard label="Landed" value={summary.landedPigeons} />
      <StatCard label="Remaining" value={summary.remainingPigeons} />
    </div>
  );
}

interface WinnerCardProps {
  title: string;
  winner: ResultWinner | null;
}

export function WinnerCard({ title, winner }: WinnerCardProps) {
  if (!winner) {
    return (
      <div className="winner-card winner-card--empty">
        <div className="winner-card__label">{title}</div>
        <div className="winner-card__meta">No winner yet</div>
      </div>
    );
  }

  const photoUrl = winner.profileImage ? resolveBannerUrl(winner.profileImage) : null;

  return (
    <div className="winner-card">
      {photoUrl ? (
        <img src={photoUrl} alt="" className="winner-card__photo" />
      ) : (
        <span className="winner-card__photo winner-card__photo--fallback" />
      )}
      <div className="winner-card__body">
        <div className="winner-card__label">{title}</div>
        <div className="winner-card__name">{winner.participantName}</div>
        <div className="winner-card__value">{formatWinnerValue(winner)}</div>
      </div>
    </div>
  );
}

interface RankingTableProps {
  rows: ParticipantResultRow[];
  compactPigeonColumns?: boolean;
}

function pigeonColumnCount(rows: ParticipantResultRow[]): number {
  return rows.reduce((max, row) => {
    const highest = row.pigeons.reduce(
      (pigeonMax, pigeon) => Math.max(pigeonMax, pigeon.pigeonNumber),
      0,
    );
    return Math.max(max, highest);
  }, 0);
}

function pigeonForColumn(
  row: ParticipantResultRow,
  pigeonNumber: number,
): ResultPigeonRow | undefined {
  return row.pigeons.find((pigeon) => pigeon.pigeonNumber === pigeonNumber);
}

export function RankingTable({ rows, compactPigeonColumns = false }: RankingTableProps) {
  if (rows.length === 0) {
    return <div className="empty-state">No rankings available yet.</div>;
  }

  const pigeonCount = pigeonColumnCount(rows);
  const pigeonNumbers = compactPigeonColumns
    ? Array.from(
        new Set(rows.flatMap((row) => row.pigeons.map((pigeon) => pigeon.pigeonNumber))),
      ).sort((left, right) => left - right)
    : Array.from({ length: pigeonCount }, (_, index) => index + 1);

  return (
    <div className="table-wrap timetable-wrap">
      <table className="data-table timetable">
        <thead>
          <tr>
            <th>Sr</th>
            <th>Picture</th>
            <th>Name</th>
            {pigeonNumbers.map((number) => (
              <th key={number}>Pigeon {number}</th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            return (
              <tr key={row.participantId}>
                <td>{row.rank ?? index + 1}</td>
                <td>
                  {row.profileImage ? (
                    <img
                      src={resolveBannerUrl(row.profileImage) ?? ''}
                      alt=""
                      className="timetable-avatar"
                    />
                  ) : (
                    <span className="timetable-avatar timetable-avatar--fallback" />
                  )}
                </td>
                <td>
                  <div className="timetable-name">{row.participantName}</div>
                  <div className="timetable-loft">{row.loftName}</div>
                  {row.currentFlyingTimeMs !== null && row.remainingPigeons > 0 && (
                    <div className="timetable-flying">
                      Flying time {formatClockDuration(row.currentFlyingTimeMs, false)}
                    </div>
                  )}
                </td>
                {pigeonNumbers.map((number) => {
                  const pigeon = pigeonForColumn(row, number);
                  return (
                    <td key={number} className="timetable-time">
                      {pigeon?.landingClockTime ?? ''}
                      {pigeon?.landingTimeMs !== null && pigeon?.landingTimeMs !== undefined && (
                        <span className="timetable-cumulative">
                          {formatClockDuration(pigeon.landingTimeMs)}
                        </span>
                      )}
                      {pigeon?.isDoubleStamp && pigeon.landingClockTime && (
                        <span className="double-stamp-badge">Double stamp</span>
                      )}
                      {pigeon?.isBrave && pigeon.landingClockTime && (
                        <span className="bravery-badge">Bravery</span>
                      )}
                    </td>
                  );
                })}
                <td className="timetable-total">
                  {formatClockDuration(row.landedPigeons > 0 ? row.totalLandingTimeMs : 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface TournamentTotalTableProps {
  rows: ParticipantResultRow[];
  raceDays: Array<{
    id: string;
    label: string;
    results: DailyResultDto | null;
  }>;
}

export function TournamentTotalTable({ rows, raceDays }: TournamentTotalTableProps) {
  if (rows.length === 0) {
    return <div className="empty-state">No rankings available yet.</div>;
  }

  return (
    <div className="table-wrap timetable-wrap">
      <table className="data-table timetable tournament-total-table">
        <thead>
          <tr>
            <th>Sr</th>
            <th>Picture</th>
            <th>Name</th>
            <th>Pigeons</th>
            {raceDays.map((raceDay) => (
              <th key={raceDay.id}>{raceDay.label}</th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const dailyRows = raceDays.map((raceDay) =>
              raceDay.results?.rankings.find(
                (dailyRow) => dailyRow.participantId === row.participantId,
              ),
            );
            const landedAcrossRaceDays = dailyRows.reduce(
              (total, dailyRow) => total + (dailyRow?.landedPigeons ?? 0),
              0,
            );
            const totalAcrossRaceDays = dailyRows.reduce(
              (total, dailyRow) =>
                total + (dailyRow && dailyRow.landedPigeons > 0 ? dailyRow.totalLandingTimeMs : 0),
              0,
            );

            return (
              <tr key={row.participantId}>
                <td>{row.rank ?? index + 1}</td>
                <td>
                  {row.profileImage ? (
                    <img
                      src={resolveBannerUrl(row.profileImage) ?? ''}
                      alt=""
                      className="timetable-avatar"
                    />
                  ) : (
                    <span className="timetable-avatar timetable-avatar--fallback" />
                  )}
                </td>
                <td>
                  <div className="timetable-name">{row.participantName}</div>
                  <div className="timetable-loft">{row.loftName}</div>
                </td>
                <td className="timetable-time">{landedAcrossRaceDays}</td>
                {dailyRows.map((dailyRow, raceDayIndex) => (
                  <td key={raceDays[raceDayIndex].id} className="timetable-time">
                    {dailyRow && dailyRow.landedPigeons > 0
                      ? formatClockDuration(dailyRow.totalLandingTimeMs)
                      : '—'}
                  </td>
                ))}
                <td className="timetable-total">{formatClockDuration(totalAcrossRaceDays)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface TournamentBannerProps {
  title: string;
  bannerUrl: string | null;
}

export function TournamentBanner({ title, bannerUrl }: TournamentBannerProps) {
  if (!bannerUrl) return null;
  return <img src={bannerUrl} alt={`${title} banner`} className="tournament-banner" />;
}
