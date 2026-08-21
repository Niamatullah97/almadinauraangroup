import { RaceDayDto } from '@kabootar/shared';
import Link from 'next/link';

import { formatDate } from '@/lib/format';

interface RaceDayTabsProps {
  tournamentId: string;
  raceDays: RaceDayDto[];
  activeRaceDayId?: string;
  active: 'daily' | 'total' | 'double-stamp';
  doubleStampEnabled?: boolean;
}

export function RaceDayTabs({
  tournamentId,
  raceDays,
  activeRaceDayId,
  active,
  doubleStampEnabled = false,
}: RaceDayTabsProps) {
  return (
    <nav className="tabs result-tabs" aria-label="Tournament results">
      {raceDays.map((day) => (
        <Link
          key={day.id}
          href={`/tournaments/${tournamentId}/results/daily/${day.id}`}
          className={active === 'daily' && day.id === activeRaceDayId ? 'tab tab--active' : 'tab'}
        >
          {formatDate(day.raceDate)}
        </Link>
      ))}
      <Link
        href={`/tournaments/${tournamentId}/results/total`}
        className={active === 'total' ? 'tab tab--active' : 'tab'}
      >
        Total
      </Link>
      {doubleStampEnabled && (
        <Link
          href={`/tournaments/${tournamentId}/results/double-stamp`}
          className={active === 'double-stamp' ? 'tab tab--active' : 'tab'}
        >
          Double Stamp Total
        </Link>
      )}
    </nav>
  );
}
