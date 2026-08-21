export interface DashboardStats {
  totalTournaments: number;
  activeTournaments: number;
  totalParticipants: number;
  totalPigeons: number;
  totalEntryFees: number;
  totalPrizePool: number;
}

export const EMPTY_DASHBOARD_STATS: DashboardStats = {
  totalTournaments: 0,
  activeTournaments: 0,
  totalParticipants: 0,
  totalPigeons: 0,
  totalEntryFees: 0,
  totalPrizePool: 0,
};
