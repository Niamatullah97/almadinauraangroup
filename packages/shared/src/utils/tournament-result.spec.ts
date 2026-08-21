import { ResultPigeonLandingInput, TournamentResultInput } from '../types/tournament-result';
import {
  assignCompetitionRanks,
  calculateDailyResults,
  calculateDoubleStampResults,
  calculateFlightDurationMs,
  calculateTotalResults,
  calculateWindowedDurationMs,
  findAverageWinner,
  findFirstWinner,
  findLastWinner,
  formatClockDuration,
  formatWinnerValue,
  toDailyPigeonInputs,
} from './tournament-result';

const RACE_DAY = {
  raceDayId: 'race-day-1',
  raceDate: '2026-04-01',
  releaseTime: '06:30',
  endTime: '18:00',
};

const WINDOW = {
  startTime: '06:00',
  endTime: '18:00',
};

const NOW = new Date(2026, 3, 1, 12, 0, 0);

function landingAt(hours: number, minutes: number, seconds = 0, day = 1): Date {
  return new Date(2026, 3, day, hours, minutes, seconds);
}

function pigeon(
  id: string,
  participantId: string,
  name: string,
  loft: string,
  number: number,
  landing: Date | null,
  isDoubleStamp = false,
): ResultPigeonLandingInput {
  return {
    registrationPigeonId: id,
    participantId,
    participantName: name,
    loftName: loft,
    pigeonNumber: number,
    ringNumber: `PK-${number}`,
    isDoubleStamp,
    landingTime: landing,
  };
}

function tournamentInput(
  pigeons: TournamentResultInput['pigeons'],
  raceDays: TournamentResultInput['raceDays'] = [RACE_DAY],
): TournamentResultInput {
  return {
    tournamentId: 'tournament-1',
    startDate: '2026-04-01',
    endDate: '2026-04-03',
    startTime: WINDOW.startTime,
    endTime: WINDOW.endTime,
    totalPigeonsAllowed: 2,
    raceDays,
    pigeons,
  };
}

describe('tournament-result calculations', () => {
  describe('calculateFlightDurationMs', () => {
    it('returns duration from release to landing', () => {
      const duration = calculateFlightDurationMs(
        RACE_DAY.raceDate,
        RACE_DAY.releaseTime,
        landingAt(8, 0),
      );
      expect(duration).toBe(90 * 60 * 1000);
    });

    it('returns null when landing is before release', () => {
      const duration = calculateFlightDurationMs(
        RACE_DAY.raceDate,
        RACE_DAY.releaseTime,
        landingAt(6, 0),
      );
      expect(duration).toBeNull();
    });
  });

  describe('calculateWindowedDurationMs', () => {
    it('counts only hours inside the daily racing window', () => {
      const duration = calculateWindowedDurationMs(
        landingAt(6, 0),
        landingAt(9, 0),
        WINDOW.startTime,
        WINDOW.endTime,
      );
      expect(duration).toBe(3 * 60 * 60 * 1000);
    });

    it('excludes overnight hours between end time and next start time', () => {
      const duration = calculateWindowedDurationMs(
        landingAt(17, 0, 0, 1),
        landingAt(8, 0, 0, 2),
        WINDOW.startTime,
        WINDOW.endTime,
      );
      // 17:00-18:00 = 1h, then 06:00-08:00 = 2h
      expect(duration).toBe(3 * 60 * 60 * 1000);
    });
  });

  describe('formatClockDuration', () => {
    it('formats unbounded hours as HH:MM:SS', () => {
      expect(formatClockDuration(84 * 3600 * 1000 + 45 * 60 * 1000)).toBe('84:45:00');
    });
  });

  describe('daily ranking', () => {
    it('ranks participants by sequential cumulative time ascending', () => {
      const pigeons = [
        pigeon('p1', 'participant-a', 'Ahmed', 'Sky Loft', 1, landingAt(8, 0)),
        pigeon('p2', 'participant-a', 'Ahmed', 'Sky Loft', 2, landingAt(8, 30)),
        pigeon('p3', 'participant-b', 'Bilal', 'Star Loft', 1, landingAt(7, 45)),
      ];

      const result = calculateDailyResults(RACE_DAY, pigeons, WINDOW, NOW);

      expect(result.rankings[0].participantId).toBe('participant-b');
      expect(result.rankings[0].rank).toBe(1);
      expect(result.rankings[1].participantId).toBe('participant-a');
      expect(result.rankings[1].rank).toBe(2);
    });

    it('calculates every pigeon from the race-day release time', () => {
      const pigeons = [
        pigeon('p1', 'participant-a', 'Ahmed', 'Sky Loft', 1, landingAt(8, 0)),
        pigeon('p2', 'participant-a', 'Ahmed', 'Sky Loft', 2, landingAt(9, 30)),
      ];

      const result = calculateDailyResults(RACE_DAY, pigeons, WINDOW, NOW);
      const row = result.rankings[0];

      expect(row.pigeons[0].landingClockTime).toBe('08:00:00');
      expect(row.pigeons[0].landingTimeMs).toBe(90 * 60 * 1000);
      expect(row.pigeons[1].landingClockTime).toBe('09:30:00');
      expect(row.pigeons[1].landingTimeMs).toBe(180 * 60 * 1000);
      expect(row.totalLandingTimeMs).toBe(270 * 60 * 1000);
    });

    it('assigns same rank for tied total landing times', () => {
      const pigeons = [
        pigeon('p1', 'participant-a', 'Ahmed', 'Sky Loft', 1, landingAt(8, 0)),
        pigeon('p2', 'participant-b', 'Bilal', 'Star Loft', 1, landingAt(8, 0)),
        pigeon('p3', 'participant-c', 'Chaudhry', 'Elite Loft', 1, landingAt(9, 0)),
      ];

      const result = calculateDailyResults(RACE_DAY, pigeons, WINDOW, NOW);

      expect(result.rankings[0].rank).toBe(1);
      expect(result.rankings[1].rank).toBe(1);
      expect(result.rankings[2].rank).toBe(3);
    });

    it('handles partial landing and remaining pigeons', () => {
      const pigeons = [
        pigeon('p1', 'participant-a', 'Ahmed', 'Sky Loft', 1, landingAt(8, 0)),
        pigeon('p2', 'participant-a', 'Ahmed', 'Sky Loft', 2, null),
        pigeon('p3', 'participant-b', 'Bilal', 'Star Loft', 1, null),
      ];

      const result = calculateDailyResults(RACE_DAY, pigeons, WINDOW, NOW);

      expect(result.summary.totalPigeons).toBe(3);
      expect(result.summary.landedPigeons).toBe(1);
      expect(result.summary.remainingPigeons).toBe(2);
      expect(
        result.rankings.find((row) => row.participantId === 'participant-a')?.remainingPigeons,
      ).toBe(1);
      expect(result.rankings.find((row) => row.participantId === 'participant-b')?.rank).toBeNull();
    });
  });

  describe('winners', () => {
    it('picks first winner as the latest first pigeon once every loft has landed one', () => {
      const pigeons = [
        pigeon('p1', 'participant-a', 'Ahmed', 'Sky Loft', 1, landingAt(7, 45)),
        pigeon('p2', 'participant-a', 'Ahmed', 'Sky Loft', 2, landingAt(9, 0)),
        pigeon('p3', 'participant-b', 'Bilal', 'Star Loft', 1, landingAt(8, 15)),
      ];

      const result = calculateDailyResults(RACE_DAY, pigeons, WINDOW, NOW);

      expect(result.firstWinner?.registrationPigeonId).toBe('p3');
      expect(result.firstWinner?.landingClockTime).toBe('08:15:00');
      expect(result.lastWinner).toBeNull();
      expect(result.bravePigeon).toBeNull();
      expect(result.averageWinner?.participantId).toBe('participant-a');
    });

    it('does not name a first winner until every loft has a first pigeon', () => {
      const pigeons = [
        pigeon('p1', 'participant-a', 'Ahmed', 'Sky Loft', 1, landingAt(7, 45)),
        pigeon('p2', 'participant-b', 'Bilal', 'Star Loft', 1, null),
      ];

      const result = calculateDailyResults(RACE_DAY, pigeons, WINDOW, NOW);

      expect(result.firstWinner).toBeNull();
    });

    it('picks last winner from complete lofts whose last pigeon is closest to race end', () => {
      const pigeons = [
        pigeon('p1', 'participant-a', 'Ahmed', 'Sky Loft', 1, landingAt(8, 0)),
        pigeon('p2', 'participant-a', 'Ahmed', 'Sky Loft', 2, landingAt(16, 30)),
        pigeon('p3', 'participant-b', 'Bilal', 'Star Loft', 1, landingAt(9, 0)),
        pigeon('p4', 'participant-b', 'Bilal', 'Star Loft', 2, landingAt(17, 45)),
        pigeon('p5', 'participant-c', 'Chaudhry', 'Elite Loft', 1, landingAt(10, 0)),
      ];

      const result = calculateDailyResults(RACE_DAY, pigeons, WINDOW, {
        now: landingAt(19, 0),
        totalPigeonsAllowed: 2,
        raceEnded: true,
      });

      expect(result.lastWinner?.participantId).toBe('participant-b');
      expect(result.lastWinner?.registrationPigeonId).toBe('p4');
      expect(result.lastWinner?.landingClockTime).toBe('17:45:00');
      expect(result.bravePigeon?.registrationPigeonId).toBe('p4');
      expect(result.bravePigeon?.category).toBe('brave');
      expect(
        result.rankings
          .find((row) => row.participantId === 'participant-b')
          ?.pigeons.find((pigeon) => pigeon.registrationPigeonId === 'p4')?.isBrave,
      ).toBe(true);
      expect(
        result.rankings
          .find((row) => row.participantId === 'participant-a')
          ?.pigeons.every((pigeon) => pigeon.isBrave === false),
      ).toBe(true);
    });

    it('excludes incomplete lofts and landings after race end from last winner', () => {
      const pigeons = [
        pigeon('p1', 'participant-a', 'Ahmed', 'Sky Loft', 1, landingAt(8, 0)),
        pigeon('p2', 'participant-a', 'Ahmed', 'Sky Loft', 2, landingAt(17, 0)),
        pigeon('p3', 'participant-b', 'Bilal', 'Star Loft', 1, landingAt(9, 0)),
        pigeon('p4', 'participant-b', 'Bilal', 'Star Loft', 2, landingAt(18, 30)),
      ];

      const result = calculateDailyResults(RACE_DAY, pigeons, WINDOW, {
        now: landingAt(19, 0),
        totalPigeonsAllowed: 2,
        raceEnded: true,
      });

      expect(result.lastWinner?.participantId).toBe('participant-a');
      expect(result.lastWinner?.landingClockTime).toBe('17:00:00');
    });

    it('picks average winner by highest total flying time', () => {
      const pigeons = [
        pigeon('p1', 'participant-a', 'Ahmed', 'Sky Loft', 1, landingAt(8, 0)),
        pigeon('p2', 'participant-a', 'Ahmed', 'Sky Loft', 2, landingAt(10, 0)),
        pigeon('p3', 'participant-b', 'Bilal', 'Star Loft', 1, landingAt(7, 0)),
      ];

      const result = calculateDailyResults(RACE_DAY, pigeons, WINDOW, NOW);

      expect(result.averageWinner?.participantId).toBe('participant-a');
      expect(result.averageWinner?.landingClockTime).toBe('05:00:00');
    });

    it('returns null winners when no pigeons landed', () => {
      const pigeons = [pigeon('p1', 'participant-a', 'Ahmed', 'Sky Loft', 1, null)];

      const result = calculateDailyResults(RACE_DAY, pigeons, WINDOW, NOW);

      expect(result.firstWinner).toBeNull();
      expect(result.lastWinner).toBeNull();
      expect(result.averageWinner).toBeNull();
      expect(result.bravePigeon).toBeNull();
    });
  });

  describe('double stamp results', () => {
    it('calculates daily double stamp ranking separately', () => {
      const pigeons = [
        pigeon('p1', 'participant-a', 'Ahmed', 'Sky Loft', 1, landingAt(8, 0), true),
        pigeon('p2', 'participant-a', 'Ahmed', 'Sky Loft', 2, landingAt(7, 30), false),
        pigeon('p3', 'participant-b', 'Bilal', 'Star Loft', 1, landingAt(7, 45), true),
      ];

      const result = calculateDoubleStampResults('daily', pigeons, WINDOW, RACE_DAY);

      expect(result.rankings).toHaveLength(2);
      expect(result.rankings[0].participantId).toBe('participant-b');
    });
  });

  describe('total tournament results', () => {
    it('aggregates sequential landing times across race days', () => {
      const input = tournamentInput(
        [
          {
            registrationPigeonId: 'p1',
            participantId: 'participant-a',
            participantName: 'Ahmed',
            loftName: 'Sky Loft',
            pigeonNumber: 1,
            ringNumber: 'PK-1',
            isDoubleStamp: false,
            landings: [
              { raceDayId: 'race-day-1', landingTime: landingAt(8, 0) },
              { raceDayId: 'race-day-2', landingTime: new Date(2026, 3, 2, 8, 15) },
            ],
          },
          {
            registrationPigeonId: 'p2',
            participantId: 'participant-b',
            participantName: 'Bilal',
            loftName: 'Star Loft',
            pigeonNumber: 1,
            ringNumber: 'PK-2',
            isDoubleStamp: false,
            landings: [{ raceDayId: 'race-day-1', landingTime: landingAt(7, 45) }],
          },
        ],
        [
          RACE_DAY,
          {
            raceDayId: 'race-day-2',
            raceDate: '2026-04-02',
            releaseTime: '06:30',
            endTime: '18:00',
          },
        ],
      );

      const result = calculateTotalResults(input, NOW);

      expect(result.raceDayCount).toBe(2);
      expect(result.summary.totalPigeons).toBe(2);
      expect(result.summary.landedPigeons).toBe(2);
      expect(result.rankings[0].participantId).toBe('participant-b');
      expect(
        result.rankings.find((row) => row.participantId === 'participant-a')?.totalLandingTimeMs,
      ).toBe((3 * 60 + 15) * 60 * 1000);
    });

    it('calculates every pigeon independently from the result origin', () => {
      const input = tournamentInput([
        {
          registrationPigeonId: 'p1',
          participantId: 'participant-a',
          participantName: 'Ahmed',
          loftName: 'Sky Loft',
          pigeonNumber: 1,
          ringNumber: 'PK-1',
          isDoubleStamp: false,
          landings: [{ raceDayId: 'race-day-1', landingTime: landingAt(17, 0, 0, 1) }],
        },
        {
          registrationPigeonId: 'p2',
          participantId: 'participant-a',
          participantName: 'Ahmed',
          loftName: 'Sky Loft',
          pigeonNumber: 2,
          ringNumber: 'PK-2',
          isDoubleStamp: false,
          landings: [{ raceDayId: 'race-day-1', landingTime: landingAt(8, 0, 0, 2) }],
        },
      ]);

      const result = calculateTotalResults(input, NOW);
      const row = result.rankings[0];

      // First pigeon: 06:30 -> 17:00 = 10h 30m
      expect(row.pigeons[0].landingTimeMs).toBe((10 * 60 + 30) * 60 * 1000);
      // Second pigeon: 06:30 on day one to 08:00 on day two = 25h 30m
      expect(row.pigeons[1].landingTimeMs).toBe((25 * 60 + 30) * 60 * 1000);
      expect(row.totalLandingTimeMs).toBe(36 * 60 * 60 * 1000);
    });
  });

  describe('assignCompetitionRanks', () => {
    it('keeps unranked participants at the bottom', () => {
      const ranked = assignCompetitionRanks([
        {
          participantId: 'a',
          participantName: 'A',
          loftName: 'Loft A',
          totalPigeons: 1,
          landedPigeons: 0,
          remainingPigeons: 1,
          totalLandingTimeMs: 0,
          averageLandingTimeMs: null,
          currentFlyingTimeMs: 0,
          pigeons: [],
        },
        {
          participantId: 'b',
          participantName: 'B',
          loftName: 'Loft B',
          totalPigeons: 1,
          landedPigeons: 1,
          remainingPigeons: 0,
          totalLandingTimeMs: 1000,
          averageLandingTimeMs: 1000,
          currentFlyingTimeMs: null,
          pigeons: [],
        },
      ]);

      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBeNull();
    });
  });

  describe('toDailyPigeonInputs', () => {
    it('maps tournament pigeons to daily inputs with missing landings', () => {
      const input = tournamentInput([
        {
          registrationPigeonId: 'p1',
          participantId: 'participant-a',
          participantName: 'Ahmed',
          loftName: 'Sky Loft',
          pigeonNumber: 1,
          ringNumber: 'PK-1',
          isDoubleStamp: false,
          landings: [{ raceDayId: 'race-day-1', landingTime: landingAt(8, 0) }],
        },
      ]);

      const daily = toDailyPigeonInputs(input, 'race-day-1');
      expect(daily[0].landingTime).not.toBeNull();
    });
  });

  describe('winner helpers', () => {
    it('findAverageWinner prefers the highest total flying time', () => {
      const origin = new Date(2026, 3, 1, 6, 30, 0);
      const participants = [
        {
          participantId: 'b',
          participantName: 'B',
          loftName: 'Loft B',
          totalPigeons: 1,
          landedPigeons: 1,
          remainingPigeons: 0,
          totalLandingTimeMs: 1000,
          averageLandingTimeMs: 1000,
          currentFlyingTimeMs: null,
          pigeons: [],
        },
        {
          participantId: 'a',
          participantName: 'A',
          loftName: 'Loft A',
          totalPigeons: 2,
          landedPigeons: 2,
          remainingPigeons: 0,
          totalLandingTimeMs: 5000,
          averageLandingTimeMs: 2500,
          currentFlyingTimeMs: null,
          pigeons: [],
        },
      ];

      expect(findAverageWinner(participants)?.participantId).toBe('a');
      expect(findFirstWinner([], origin, WINDOW)).toBeNull();
      expect(
        findLastWinner([], origin, WINDOW, {
          totalPigeonsAllowed: 2,
          raceEnded: true,
          raceEnd: landingAt(18, 0),
        }),
      ).toBeNull();
      expect(
        formatWinnerValue({
          participantId: 'a',
          participantName: 'A',
          loftName: 'Loft A',
          valueMs: 84 * 3600 * 1000 + 45 * 60 * 1000,
          category: 'average',
        }),
      ).toBe('84:45:00');
    });
  });
});
