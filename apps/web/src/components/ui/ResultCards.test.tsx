import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  RankingTable,
  ResultSummary,
  StatCard,
  TournamentTotalTable,
  WinnerCard,
} from '@/components/ui/ResultCards';

describe('ResultCards', () => {
  it('renders StatCard with label and value', () => {
    render(<StatCard label="Lofts" value={12} />);
    expect(screen.getByText('Lofts')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders ResultSummary with loft count', () => {
    render(
      <ResultSummary
        summary={{ totalPigeons: 100, landedPigeons: 80, remainingPigeons: 20 }}
        loftsCount={5}
      />,
    );

    expect(screen.getByText('Lofts')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('renders WinnerCard with clock time', () => {
    render(
      <WinnerCard
        title="First Winner"
        winner={{
          participantId: 'p1',
          participantName: 'Ali Khan',
          loftName: 'Sky Loft',
          pigeonNumber: 7,
          ringNumber: 'PK-001',
          valueMs: 125000,
          landingClockTime: '12:58:00',
          category: 'first',
        }}
      />,
    );

    expect(screen.getByText('First Winner')).toBeInTheDocument();
    expect(screen.getByText('Ali Khan')).toBeInTheDocument();
    expect(screen.getByText('12:58:00')).toBeInTheDocument();
  });

  it('renders empty winner state', () => {
    render(<WinnerCard title="Last landing" winner={null} />);
    expect(screen.getByText('No winner yet')).toBeInTheDocument();
  });

  it('renders RankingTable rows and empty state', () => {
    const { rerender } = render(<RankingTable rows={[]} />);
    expect(screen.getByText('No rankings available yet.')).toBeInTheDocument();

    rerender(
      <RankingTable
        rows={[
          {
            participantId: 'p1',
            participantName: 'Ali Khan',
            loftName: 'Sky Loft',
            rank: 1,
            totalPigeons: 10,
            landedPigeons: 8,
            remainingPigeons: 2,
            totalLandingTimeMs: 3600000,
            averageLandingTimeMs: 450000,
            currentFlyingTimeMs: 20700000,
            pigeons: [
              {
                registrationPigeonId: 'pg1',
                participantId: 'p1',
                pigeonNumber: 1,
                ringNumber: 'PK-001',
                isDoubleStamp: false,
                isBrave: false,
                landingTimeMs: 3600000,
                landingClockTime: '09:24:00',
              },
              {
                registrationPigeonId: 'pg2',
                participantId: 'p1',
                pigeonNumber: 2,
                ringNumber: 'PK-002',
                isDoubleStamp: true,
                isBrave: true,
                landingTimeMs: 450000,
                landingClockTime: '14:32:00',
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText('Ali Khan')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('09:24:00')).toBeInTheDocument();
    expect(screen.getByText('14:32:00')).toBeInTheDocument();
    expect(screen.getAllByText('01:00:00')).toHaveLength(2);
    expect(screen.getByText('00:07:30')).toBeInTheDocument();
    expect(screen.getByText('Double stamp')).toBeInTheDocument();
    expect(screen.getByText('Bravery')).toBeInTheDocument();
    expect(screen.getByText('Flying time 05:45')).toBeInTheDocument();
  });

  it('omits empty pigeon columns in compact mode', () => {
    render(
      <RankingTable
        compactPigeonColumns
        rows={[
          {
            participantId: 'p1',
            participantName: 'Ali Khan',
            loftName: 'Sky Loft',
            rank: 1,
            totalPigeons: 1,
            landedPigeons: 1,
            remainingPigeons: 0,
            totalLandingTimeMs: 15300000,
            averageLandingTimeMs: 15300000,
            currentFlyingTimeMs: null,
            pigeons: [
              {
                registrationPigeonId: 'pg2',
                participantId: 'p1',
                pigeonNumber: 2,
                ringNumber: 'PK-002',
                isDoubleStamp: true,
                isBrave: false,
                landingTimeMs: 15300000,
                landingClockTime: '04:15:00',
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.queryByText('Pigeon 1')).not.toBeInTheDocument();
    expect(screen.getByText('Pigeon 2')).toBeInTheDocument();
  });

  it('calculates the total column from race day totals', () => {
    const row = {
      participantId: 'p1',
      participantName: 'Naimat',
      loftName: 'Naimat-1',
      rank: 1,
      totalPigeons: 5,
      landedPigeons: 5,
      remainingPigeons: 0,
      totalLandingTimeMs: 0,
      averageLandingTimeMs: 0,
      currentFlyingTimeMs: null,
      pigeons: [],
    };

    render(
      <TournamentTotalTable
        rows={[row]}
        raceDays={[
          {
            id: 'rd1',
            label: '21-Aug-2026',
            results: {
              raceDayId: 'rd1',
              raceDate: '2026-08-21',
              releaseTime: '05:30',
              summary: { totalPigeons: 5, landedPigeons: 5, remainingPigeons: 0 },
              firstWinner: null,
              lastWinner: null,
              averageWinner: null,
              bravePigeon: null,
              rankings: [{ ...row, totalLandingTimeMs: 89640000 }],
            },
          },
        ]}
      />,
    );

    expect(screen.getAllByText('24:54:00')).toHaveLength(2);
  });
});
