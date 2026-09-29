import { RaceDayStatus, TournamentStatus } from '@kabootar/shared';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TournamentFrame } from './TournamentFrame';
import { TournamentHomeRedirect } from './TournamentHomeRedirect';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/tournaments/t1',
  useRouter: () => ({ replace }),
}));

vi.mock('@/lib/api/tournaments', () => ({
  getTournament: vi.fn(),
}));

vi.mock('@/lib/api/race-days', () => ({
  getRaceDays: vi.fn(),
}));

import { getRaceDays } from '@/lib/api/race-days';
import { getTournament } from '@/lib/api/tournaments';

const tournament = {
  id: 't1',
  title: 'Spring Cup',
  slug: 'tournament-5',
  description: null,
  city: 'Lahore',
  entryFee: 1000,
  totalPigeonsAllowed: 10,
  doubleStampEnabled: false,
  singleNominatedEnabled: false,
  startDate: '2026-09-29',
  endDate: '2026-10-07',
  startTime: '06:00',
  endTime: '18:00',
  status: TournamentStatus.ACTIVE,
  bannerImage: null,
  createdBy: 'u1',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const raceDay = {
  id: 'rd-today',
  tournamentId: 't1',
  raceDate: '2026-09-29',
  releaseTime: '06:00',
  endTime: '18:00',
  releaseLocation: 'Loft',
  weatherNotes: null,
  status: RaceDayStatus.LIVE,
  createdAt: '2026-09-29T00:00:00.000Z',
  updatedAt: '2026-09-29T00:00:00.000Z',
};

describe('TournamentFrame', () => {
  afterEach(() => {
    vi.mocked(getTournament).mockReset();
    vi.mocked(getRaceDays).mockReset();
    replace.mockReset();
  });

  it('loads race-day tabs in the browser so Worker misses do not hide live days', async () => {
    vi.mocked(getTournament).mockResolvedValue(tournament);
    vi.mocked(getRaceDays).mockResolvedValue([raceDay]);

    render(
      <TournamentFrame tournamentId="t1">
        <p>child page</p>
      </TournamentFrame>,
    );

    await waitFor(() => {
      expect(screen.getByText('Spring Cup')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /29-Sept-2026/i })).toBeInTheDocument();
    expect(screen.getByText('child page')).toBeInTheDocument();
  });

  it('still renders children when the tournament fetch fails', async () => {
    vi.mocked(getTournament).mockRejectedValue(new Error('timeout'));
    vi.mocked(getRaceDays).mockRejectedValue(new Error('timeout'));

    render(
      <TournamentFrame tournamentId="t1">
        <p>results still tried</p>
      </TournamentFrame>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('This tournament could not be loaded right now. Please try again.'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('results still tried')).toBeInTheDocument();
  });

  it('retries a failed tournament fetch from the browser', async () => {
    vi.mocked(getTournament)
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue(tournament);
    vi.mocked(getRaceDays).mockResolvedValue([raceDay]);

    render(
      <TournamentFrame tournamentId="t1">
        <p>child</p>
      </TournamentFrame>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      expect(screen.getByText('Spring Cup')).toBeInTheDocument();
    });
  });

  it('opens the closest race day after race days load in the browser', async () => {
    vi.mocked(getTournament).mockResolvedValue(tournament);
    vi.mocked(getRaceDays).mockResolvedValue([raceDay]);

    render(
      <TournamentFrame tournamentId="t1">
        <TournamentHomeRedirect tournamentId="t1" />
      </TournamentFrame>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/tournaments/t1/results/daily/rd-today');
    });
  });
});
