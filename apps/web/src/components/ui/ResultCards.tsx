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
        <div className="winner-card__value">
          {winner.category === 'average'
            ? formatWinnerValue(winner)
            : `Landed ${formatWinnerValue(winner)}`}
        </div>
        {winner.category === 'average' && winner.landingClockTime && (
          <div className="winner-card__meta">Landed {winner.landingClockTime}</div>
        )}
      </div>
    </div>
  );
}

interface RankingTableProps {
  rows: ParticipantResultRow[];
  compactPigeonColumns?: boolean;
  doubleStampView?: boolean;
  nominatedView?: 'double-stamp' | 'single-nominated';
  firstWinner?: ResultWinner | null;
  lastWinner?: ResultWinner | null;
  averageWinner?: ResultWinner | null;
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

function nominatedPigeon(
  row: ParticipantResultRow,
  kind: 'double-stamp' | 'single-nominated',
): ResultPigeonRow | undefined {
  if (kind === 'single-nominated') {
    return row.pigeons.find((pigeon) => pigeon.isSingleNominated) ?? row.pigeons[0];
  }
  return row.pigeons.find((pigeon) => pigeon.isDoubleStamp) ?? row.pigeons[0];
}

function winnerSlotClasses(flags: {
  first?: boolean;
  last?: boolean;
  average?: boolean;
  brave?: boolean;
}): string {
  const classes = ['timetable-time'];
  if (flags.first || flags.last || flags.average || flags.brave) {
    classes.push('timetable-cell--flash');
  }
  if (flags.first) classes.push('timetable-cell--first');
  if (flags.last) classes.push('timetable-cell--last');
  if (flags.average) classes.push('timetable-cell--average');
  if (flags.brave) classes.push('timetable-cell--brave');
  return classes.join(' ');
}

function WinnerSlotBadges({
  first,
  last,
  average,
  brave,
}: {
  first?: boolean;
  last?: boolean;
  average?: boolean;
  brave?: boolean;
}) {
  return (
    <>
      {first && <span className="winner-slot-badge winner-slot-badge--first">First winner</span>}
      {last && <span className="winner-slot-badge winner-slot-badge--last">Last winner</span>}
      {average && (
        <span className="winner-slot-badge winner-slot-badge--average">Average winner</span>
      )}
      {brave && <span className="bravery-badge">Bravery</span>}
    </>
  );
}

export function RankingTable({
  rows,
  compactPigeonColumns = false,
  doubleStampView = false,
  nominatedView,
  firstWinner = null,
  lastWinner = null,
  averageWinner = null,
}: RankingTableProps) {
  if (rows.length === 0) {
    return <div className="empty-state">No rankings available yet.</div>;
  }

  const singleColumnView = nominatedView ?? (doubleStampView ? 'double-stamp' : undefined);
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
            <th>Loft</th>
            {singleColumnView ? (
              <th>Pigeon</th>
            ) : (
              pigeonNumbers.map((number) => <th key={number}>Pigeon {number}</th>)
            )}
            {!singleColumnView && <th>Total</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const isAverageLoft = averageWinner?.participantId === row.participantId;
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
                  {!singleColumnView &&
                    row.currentFlyingTimeMs !== null &&
                    row.remainingPigeons > 0 && (
                      <div className="timetable-flying">
                        Flying time {formatClockDuration(row.currentFlyingTimeMs, false)}
                      </div>
                    )}
                </td>
                {singleColumnView ? (
                  <td className="timetable-time">
                    {nominatedPigeon(row, singleColumnView)?.landingClockTime ?? ''}
                  </td>
                ) : (
                  pigeonNumbers.map((number) => {
                    const pigeon = pigeonForColumn(row, number);
                    const isFirst = Boolean(
                      pigeon?.registrationPigeonId &&
                      pigeon.registrationPigeonId === firstWinner?.registrationPigeonId,
                    );
                    const isLast = Boolean(
                      pigeon?.registrationPigeonId &&
                      pigeon.registrationPigeonId === lastWinner?.registrationPigeonId,
                    );
                    const isAverage = Boolean(
                      pigeon?.registrationPigeonId &&
                      pigeon.registrationPigeonId === averageWinner?.registrationPigeonId,
                    );
                    const isBrave = Boolean(pigeon?.isBrave && pigeon.landingClockTime);
                    return (
                      <td
                        key={number}
                        className={winnerSlotClasses({
                          first: isFirst,
                          last: isLast,
                          average: isAverage,
                          brave: isBrave,
                        })}
                      >
                        {pigeon?.landingClockTime ?? ''}
                        {pigeon?.landingTimeMs !== null && pigeon?.landingTimeMs !== undefined && (
                          <span className="timetable-cumulative">
                            {formatClockDuration(pigeon.landingTimeMs)}
                          </span>
                        )}
                        {pigeon?.isDoubleStamp && pigeon.landingClockTime && (
                          <span className="double-stamp-badge">Double stamp</span>
                        )}
                        {pigeon?.isSingleNominated && pigeon.landingClockTime && (
                          <span className="single-nominated-badge">Nominated</span>
                        )}
                        <WinnerSlotBadges
                          first={isFirst}
                          last={isLast}
                          average={isAverage}
                          brave={isBrave}
                        />
                      </td>
                    );
                  })
                )}
                {!singleColumnView && (
                  <td
                    className={
                      isAverageLoft
                        ? 'timetable-total timetable-cell--flash timetable-cell--average'
                        : 'timetable-total'
                    }
                  >
                    {formatClockDuration(row.landedPigeons > 0 ? row.totalLandingTimeMs : 0)}
                    {isAverageLoft && (
                      <span className="winner-slot-badge winner-slot-badge--average">
                        Average winner
                      </span>
                    )}
                  </td>
                )}
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
  firstWinner?: ResultWinner | null;
  lastWinner?: ResultWinner | null;
  averageWinner?: ResultWinner | null;
}

export function TournamentTotalTable({
  rows,
  raceDays,
  firstWinner = null,
  lastWinner = null,
  averageWinner = null,
}: TournamentTotalTableProps) {
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
            <th>Loft</th>
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
                <td
                  className={winnerSlotClasses({
                    first: firstWinner?.participantId === row.participantId,
                    last: lastWinner?.participantId === row.participantId,
                    brave: lastWinner?.participantId === row.participantId,
                  })}
                >
                  <div className="timetable-name">{row.participantName}</div>
                  <WinnerSlotBadges
                    first={firstWinner?.participantId === row.participantId}
                    last={lastWinner?.participantId === row.participantId}
                    brave={lastWinner?.participantId === row.participantId}
                  />
                </td>
                <td className="timetable-time">{landedAcrossRaceDays}</td>
                {dailyRows.map((dailyRow, raceDayIndex) => (
                  <td key={raceDays[raceDayIndex].id} className="timetable-time">
                    {dailyRow && dailyRow.landedPigeons > 0
                      ? formatClockDuration(dailyRow.totalLandingTimeMs)
                      : '—'}
                  </td>
                ))}
                <td
                  className={
                    averageWinner?.participantId === row.participantId
                      ? 'timetable-total timetable-cell--flash timetable-cell--average'
                      : 'timetable-total'
                  }
                >
                  {formatClockDuration(totalAcrossRaceDays)}
                  {averageWinner?.participantId === row.participantId && (
                    <span className="winner-slot-badge winner-slot-badge--average">
                      Average winner
                    </span>
                  )}
                </td>
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
