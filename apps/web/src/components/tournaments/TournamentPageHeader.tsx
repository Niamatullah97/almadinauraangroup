import { RaceDayDto, TournamentDetailDto } from '@kabootar/shared';

import { TournamentNav } from '@/components/tournaments/TournamentNav';
import { TournamentBanner } from '@/components/ui/ResultCards';
import { ShareButton } from '@/components/ui/ShareButton';
import { resolveBannerUrl } from '@/lib/config';

interface TournamentPageHeaderProps {
  tournament: TournamentDetailDto;
  tournamentId: string;
  raceDays: RaceDayDto[];
}

export function TournamentPageHeader({
  tournament,
  tournamentId,
  raceDays,
}: TournamentPageHeaderProps) {
  const bannerUrl = resolveBannerUrl(tournament.bannerImage);

  return (
    <>
      <TournamentBanner title={tournament.title} bannerUrl={bannerUrl} />

      <div className="page-hero page-hero--split">
        <div>
          <h1>{tournament.title}</h1>
          {tournament.description && <p>{tournament.description}</p>}
        </div>
        <ShareButton />
      </div>

      <TournamentNav
        tournamentId={tournamentId}
        raceDays={raceDays}
        doubleStampEnabled={tournament.doubleStampEnabled}
        singleNominatedEnabled={tournament.singleNominatedEnabled}
      />
    </>
  );
}
