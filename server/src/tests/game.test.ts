import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { prisma } from '../prisma';
import { isAnswerCorrect, normalizeAnswer } from '../utils/answerChecker';
import { getTeamPhysicalRoute, formatTeamCode, parseTeamCodeNumber } from '../utils/routesHelper';
import { computeEventSummary } from '../utils/eventHelper';
import bcrypt from 'bcryptjs';

describe('SECURITY JEOPARDY - Critical Functionality Tests', () => {
  before(async () => {
    // Ensure DB connection is active
    await prisma.$connect();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  test('Answer Normalization & Variant Matching', () => {
    // Normalization rules: trim, uppercase, collapse whitespace
    assert.equal(normalizeAnswer('   firewall   '), 'FIREWALL');
    assert.equal(normalizeAnswer('man   in   the   middle'), 'MAN IN THE MIDDLE');

    // Matching tests
    assert.equal(isAnswerCorrect('firewall', 'FIREWALL', ['FIRE WALL']), true);
    assert.equal(isAnswerCorrect('FIRE WALL', 'FIREWALL', ['FIRE WALL']), true);
    assert.equal(isAnswerCorrect('mitm', 'MAN IN THE MIDDLE', ['MITM', 'MAN-IN-THE-MIDDLE']), true);
    assert.equal(isAnswerCorrect('man-in-the-middle', 'MAN IN THE MIDDLE', ['MITM']), true);
    assert.equal(isAnswerCorrect('wrong answer', 'FIREWALL', []), false);
  });

  test('Physical Route Rotation Logic', () => {
    // Team 1 starts at P01
    const route1 = getTeamPhysicalRoute(0);
    assert.deepEqual(route1, ['P01', 'P02', 'P03', 'P04', 'P05']);

    // Team 2 starts at P02
    const route2 = getTeamPhysicalRoute(1);
    assert.deepEqual(route2, ['P02', 'P03', 'P04', 'P05', 'P01']);

    // Team 5 starts at P05
    const route5 = getTeamPhysicalRoute(4);
    assert.deepEqual(route5, ['P05', 'P01', 'P02', 'P03', 'P04']);

    // Team 6 wraps around to index 0
    const route6 = getTeamPhysicalRoute(5);
    assert.deepEqual(route6, ['P01', 'P02', 'P03', 'P04', 'P05']);
  });

  test('Team Code Generation & Parsing', () => {
    assert.equal(formatTeamCode(1), 'SJ-T001');
    assert.equal(formatTeamCode(42), 'SJ-T042');
    assert.equal(parseTeamCodeNumber('SJ-T007'), 7);
  });

  test('Event Timer & State Authorization', () => {
    const now = new Date();
    // NOT_STARTED
    const notStarted = computeEventSummary({
      id: 'test-event',
      name: 'SECURITY JEOPARDY',
      status: 'NOT_STARTED',
      startTime: null,
      endTime: null,
      durationMinutes: 60,
      remainingSecondsWhenPaused: null,
      isLeaderboardVisible: true,
      createdAt: now,
      updatedAt: now,
    });
    assert.equal(notStarted.canSubmit, false);
    assert.equal(notStarted.remainingSeconds, 3600);

    // RUNNING with active time
    const running = computeEventSummary({
      id: 'test-event',
      name: 'SECURITY JEOPARDY',
      status: 'RUNNING',
      startTime: new Date(now.getTime() - 10 * 60 * 1000),
      endTime: new Date(now.getTime() + 50 * 60 * 1000),
      durationMinutes: 60,
      remainingSecondsWhenPaused: null,
      isLeaderboardVisible: true,
      createdAt: now,
      updatedAt: now,
    });
    assert.equal(running.canSubmit, true);
    assert.ok(running.remainingSeconds > 2900 && running.remainingSeconds <= 3000);

    // PAUSED
    const paused = computeEventSummary({
      id: 'test-event',
      name: 'SECURITY JEOPARDY',
      status: 'PAUSED',
      startTime: now,
      endTime: null,
      durationMinutes: 60,
      remainingSecondsWhenPaused: 1800,
      isLeaderboardVisible: true,
      createdAt: now,
      updatedAt: now,
    });
    assert.equal(paused.canSubmit, false);
    assert.equal(paused.remainingSeconds, 1800);

    // ENDED
    const ended = computeEventSummary({
      id: 'test-event',
      name: 'SECURITY JEOPARDY',
      status: 'ENDED',
      startTime: now,
      endTime: now,
      durationMinutes: 60,
      remainingSecondsWhenPaused: 0,
      isLeaderboardVisible: true,
      createdAt: now,
      updatedAt: now,
    });
    assert.equal(ended.canSubmit, false);
    assert.equal(ended.remainingSeconds, 0);
  });

  test('Database: Verification of Seeded Challenges & Flag Codes', async () => {
    const onlineCount = await prisma.challenge.count({ where: { type: 'ONLINE' } });
    const physicalCount = await prisma.challenge.count({ where: { type: 'PHYSICAL' } });
    assert.equal(onlineCount, 10, 'Expected 10 online challenges');
    assert.equal(physicalCount, 5, 'Expected 5 physical challenges');

    // Verify Team 1 has 5 team-specific physical flags
    const team1 = await prisma.team.findUnique({
      where: { teamCode: 'SJ-T001' },
      include: { physicalFlags: true },
    });
    assert.ok(team1, 'Team 1 must exist');
    assert.equal(team1.physicalFlags.length, 5, 'Team 1 must have 5 physical flags');

    // Verify flag format: P#-SJ-T001-FRAGMENT-RANDOM
    const flagCodes = team1.physicalFlags.map((f) => f.flagCode);
    assert.ok(flagCodes.some((code) => code.startsWith('P1-SJ-T001-C-')));
    assert.ok(flagCodes.some((code) => code.startsWith('P2-SJ-T001-Y-')));
    assert.ok(flagCodes.some((code) => code.startsWith('P3-SJ-T001-B-')));
    assert.ok(flagCodes.some((code) => code.startsWith('P4-SJ-T001-E-')));
    assert.ok(flagCodes.some((code) => code.startsWith('P5-SJ-T001-R-')));
  });

  test('Database: Anti-Cheating & Cross-Team Flag Isolation', async () => {
    const team1Flag = await prisma.physicalFlag.findFirst({
      where: { team: { teamCode: 'SJ-T001' } },
    });
    const team2 = await prisma.team.findUnique({
      where: { teamCode: 'SJ-T002' },
    });

    assert.ok(team1Flag && team2);
    // If team 2 checks ownership of team 1's flag
    const belongsToTeam2 = team1Flag.teamId === team2.id;
    assert.equal(belongsToTeam2, false, "Team 1's flag must not belong to Team 2");
  });

  test('Database: Leaderboard Ranking Calculations', async () => {
    const teams = await prisma.team.findMany({
      orderBy: [
        { score: 'desc' },
        { completedCount: 'desc' },
        { lastSolveAt: { sort: 'asc', nulls: 'last' } },
      ],
    });
    assert.ok(teams.length >= 5);
  });
});
