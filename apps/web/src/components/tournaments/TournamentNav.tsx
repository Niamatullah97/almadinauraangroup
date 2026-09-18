'use client';

import { RaceDayDto } from '@kabootar/shared';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { formatDate } from '@/lib/format';

interface TournamentNavProps {
  tournamentId: string;
  raceDays?: RaceDayDto[];
  doubleStampEnabled?: boolean;
  singleNominatedEnabled?: boolean;
}

export function TournamentNav({
  tournamentId,
  raceDays = [],
  doubleStampEnabled = false,
  singleNominatedEnabled = false,
}: TournamentNavProps) {
  const pathname = usePathname();
  const base = `/tournaments/${tournamentId}`;

  function tabClass(isActive: boolean) {
    return isActive ? 'tab tab--active' : 'tab';
  }

  return (
    <nav className="tabs result-tabs" aria-label="Tournament sections">
      <Link
        href={`${base}/results/total`}
        prefetch={false}
        className={tabClass(pathname === `${base}/results/total`)}
      >
        Total results
      </Link>
      {raceDays.map((day) => (
        <Link
          key={day.id}
          href={`${base}/results/daily/${day.id}`}
          prefetch={false}
          className={tabClass(pathname === `${base}/results/daily/${day.id}`)}
        >
          {formatDate(day.raceDate)}
        </Link>
      ))}
      {doubleStampEnabled && (
        <Link
          href={`${base}/results/double-stamp`}
          prefetch={false}
          className={tabClass(pathname === `${base}/results/double-stamp`)}
        >
          Double stamp
        </Link>
      )}
      {singleNominatedEnabled && (
        <Link
          href={`${base}/results/single-nominated`}
          prefetch={false}
          className={tabClass(pathname === `${base}/results/single-nominated`)}
        >
          Single nominated
        </Link>
      )}
      <Link
        href={`${base}/overview`}
        prefetch={false}
        className={tabClass(pathname === `${base}/overview`)}
      >
        Overview
      </Link>
    </nav>
  );
}
