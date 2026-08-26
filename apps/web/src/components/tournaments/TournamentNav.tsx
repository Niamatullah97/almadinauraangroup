import Link from 'next/link';

interface TournamentNavProps {
  tournamentId: string;
  active: 'overview' | 'total' | 'double-stamp' | 'daily';
  raceDayId?: string;
  doubleStampEnabled?: boolean;
}

export function TournamentNav({
  tournamentId,
  active,
  raceDayId,
  doubleStampEnabled = false,
}: TournamentNavProps) {
  const base = `/tournaments/${tournamentId}`;

  return (
    <nav className="tabs" aria-label="Tournament sections">
      <Link href={base} className={active === 'overview' ? 'tab tab--active' : 'tab'}>
        Overview
      </Link>
      <Link
        href={`${base}/results/total`}
        className={active === 'total' ? 'tab tab--active' : 'tab'}
      >
        Total results
      </Link>
      {doubleStampEnabled && (
        <Link
          href={`${base}/results/double-stamp`}
          className={active === 'double-stamp' ? 'tab tab--active' : 'tab'}
        >
          Double stamp
        </Link>
      )}
      {raceDayId && (
        <Link
          href={`${base}/results/daily/${raceDayId}`}
          className={active === 'daily' ? 'tab tab--active' : 'tab'}
        >
          Daily results
        </Link>
      )}
    </nav>
  );
}
