import { TournamentStatus } from '@kabootar/shared';
import Link from 'next/link';

import { resolveBannerUrl } from '@/lib/config';
import { formatCurrency, formatDate, formatStatus } from '@/lib/format';

interface TournamentCardProps {
  tournament: {
    id: string;
    title: string;
    city: string;
    entryFee: number;
    totalPigeonsAllowed: number;
    startDate: string;
    status: TournamentStatus | string;
    bannerImage?: string | null;
  };
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const bannerUrl = resolveBannerUrl(tournament.bannerImage);
  const statusClass =
    tournament.status === TournamentStatus.ACTIVE
      ? 'badge badge--active'
      : tournament.status === TournamentStatus.COMPLETED
        ? 'badge badge--completed'
        : 'badge badge--draft';

  return (
    <Link href={`/tournaments/${tournament.id}`} className="card link-card">
      {bannerUrl && (
        <img
          src={bannerUrl}
          alt=""
          style={{
            width: '100%',
            height: 140,
            objectFit: 'cover',
            borderRadius: 8,
            marginBottom: 12,
          }}
        />
      )}
      <h2 style={{ fontSize: '1.125rem', marginBottom: 8 }}>{tournament.title}</h2>
      <p style={{ color: 'var(--color-muted)', marginBottom: 12 }}>{tournament.city}</p>
      <div className="meta-row">
        <span>{formatDate(tournament.startDate)}</span>
        <span>{formatCurrency(tournament.entryFee)}</span>
        <span>{tournament.totalPigeonsAllowed} slots</span>
      </div>
      <div style={{ marginTop: 12 }}>
        <span className={statusClass}>{formatStatus(tournament.status)}</span>
      </div>
    </Link>
  );
}
