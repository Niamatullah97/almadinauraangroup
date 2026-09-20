import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ResultPageLoader } from './ResultPageLoader';

const rankingRow = {
  participantId: 'p1',
  participantName: 'Ali Khan',
  loftName: 'Sky Loft',
  rank: 1,
  totalPigeons: 2,
  landedPigeons: 2,
  remainingPigeons: 0,
  totalLandingTimeMs: 1000,
  averageLandingTimeMs: 500,
  currentFlyingTimeMs: null,
  pigeons: [],
};

const summary = { totalPigeons: 10, landedPigeons: 8, remainingPigeons: 2 };

const dailyResult = {
  raceDayId: 'rd1',
  raceDate: '2026-09-20',
  releaseTime: '06:00',
  summary,
  firstWinner: null,
  lastWinner: null,
  averageWinner: null,
  bravePigeon: null,
  rankings: [rankingRow],
};

const totalResult = {
  tournamentId: 't1',
  raceDayCount: 1,
  summary,
  firstWinner: null,
  lastWinner: null,
  averageWinner: null,
  bravePigeon: null,
  rankings: [rankingRow],
};

const nominatedResult = {
  scope: 'total' as const,
  summary,
  firstWinner: null,
  lastWinner: null,
  averageWinner: null,
  bravePigeon: null,
  rankings: [rankingRow],
};

vi.mock('@/lib/api/results', () => ({
  getDailyResults: vi.fn(),
  getTotalResults: vi.fn(),
  getTotalDoubleStampResults: vi.fn(),
  getTotalSingleNominatedResults: vi.fn(),
}));

import {
  getDailyResults,
  getTotalDoubleStampResults,
  getTotalResults,
  getTotalSingleNominatedResults,
} from '@/lib/api/results';

describe('ResultPageLoader', () => {
  afterEach(() => {
    vi.mocked(getDailyResults).mockReset();
    vi.mocked(getTotalResults).mockReset();
    vi.mocked(getTotalDoubleStampResults).mockReset();
    vi.mocked(getTotalSingleNominatedResults).mockReset();
  });

  it('loads daily rankings in the browser instead of during SSR', async () => {
    vi.mocked(getDailyResults).mockResolvedValue(dailyResult);

    render(
      <ResultPageLoader
        variant="daily"
        tournamentId="t1"
        raceDayId="rd1"
        title="20 Sept 2026 Results"
        subtitle="Race time 06:00 – 18:00"
      />,
    );

    expect(screen.getByText('Loading results…')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('20 Sept 2026 Results')).toBeInTheDocument();
    });
    expect(screen.getByText('Ali Khan')).toBeInTheDocument();
    expect(screen.getByText('Winners')).toBeInTheDocument();
    expect(getDailyResults).toHaveBeenCalledWith('t1', 'rd1');
  });

  it('shows an empty state when daily results are missing', async () => {
    vi.mocked(getDailyResults).mockResolvedValue(null);

    render(
      <ResultPageLoader variant="daily" tournamentId="t1" raceDayId="rd1" title="Daily results" />,
    );

    await waitFor(() => {
      expect(screen.getByText('Results are not available yet.')).toBeInTheDocument();
    });
  });

  it('shows an empty state when a results request throws', async () => {
    vi.mocked(getDailyResults).mockRejectedValue(new Error('network down'));

    render(
      <ResultPageLoader variant="daily" tournamentId="t1" raceDayId="rd1" title="Daily results" />,
    );

    await waitFor(() => {
      expect(screen.getByText('Results are not available yet.')).toBeInTheDocument();
    });
  });

  it('loads total rankings with race-day columns in the browser', async () => {
    vi.mocked(getTotalResults).mockResolvedValue(totalResult);
    vi.mocked(getDailyResults).mockResolvedValue(dailyResult);

    render(
      <ResultPageLoader
        variant="total"
        tournamentId="t1"
        title="Total Results"
        raceDays={[{ id: 'rd1', label: '20 Sept 2026' }]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Total Results')).toBeInTheDocument();
    });
    expect(screen.getByText('Ali Khan')).toBeInTheDocument();
    expect(screen.getByText('20 Sept 2026')).toBeInTheDocument();
    expect(getTotalResults).toHaveBeenCalledWith('t1');
    expect(getDailyResults).toHaveBeenCalledWith('t1', 'rd1');
  });

  it('loads double-stamp rankings without winner cards', async () => {
    vi.mocked(getTotalDoubleStampResults).mockResolvedValue(nominatedResult);

    render(
      <ResultPageLoader variant="double-stamp" tournamentId="t1" title="Double Stamp Results" />,
    );

    await waitFor(() => {
      expect(screen.getByText('Double Stamp Results')).toBeInTheDocument();
    });
    expect(screen.getByText('Ali Khan')).toBeInTheDocument();
    expect(screen.queryByText('Winners')).not.toBeInTheDocument();
    expect(getTotalDoubleStampResults).toHaveBeenCalledWith('t1');
  });

  it('loads single-nominated rankings without winner cards', async () => {
    vi.mocked(getTotalSingleNominatedResults).mockResolvedValue(nominatedResult);

    render(
      <ResultPageLoader
        variant="single-nominated"
        tournamentId="t1"
        title="Single Nominated Results"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Single Nominated Results')).toBeInTheDocument();
    });
    expect(screen.getByText('Ali Khan')).toBeInTheDocument();
    expect(screen.queryByText('Winners')).not.toBeInTheDocument();
    expect(getTotalSingleNominatedResults).toHaveBeenCalledWith('t1');
  });
});
