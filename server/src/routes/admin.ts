import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { getActiveEvent, computeEventSummary } from '../utils/eventHelper';
import { getTeamPhysicalRoute } from '../utils/routesHelper';

const router = Router();

function parseDuration(value: unknown, fallback: number): number | null {
  if (value === undefined || value === null || value === '') return fallback;
  const minutes = parseInt(String(value), 10);
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 24 * 60) return null;
  return minutes;
}

// Apply requireAdmin to all admin endpoints
router.use(requireAdmin);

// GET /api/admin/overview - Overall event statistics and status
router.get('/overview', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const event = await getActiveEvent();
    const eventSummary = computeEventSummary(event);

    const totalTeams = await prisma.team.count();
    const totalSubmissions = await prisma.submission.count();
    const correctSubmissions = await prisma.submission.count({ where: { isCorrect: true } });
    const totalPhysicalCaptured = await prisma.physicalFlag.count({ where: { isCaptured: true } });

    const teams = await prisma.team.findMany({
      orderBy: { score: 'desc' },
      take: 5,
      select: { teamCode: true, teamName: true, score: true },
    });

    res.json({
      success: true,
      event: eventSummary,
      stats: {
        totalTeams,
        totalSubmissions,
        correctSubmissions,
        totalPhysicalCaptured,
        topTeams: teams,
      },
    });
  } catch (err: any) {
    console.error('Admin overview error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch admin overview.' });
  }
});

// Event Control: START
router.post('/event/start', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const event = await getActiveEvent();
    const durationMinutes = parseDuration(req.body?.durationMinutes, event.durationMinutes);
    if (durationMinutes === null) {
      res.status(400).json({ success: false, error: 'durationMinutes must be between 1 and 1440.' });
      return;
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        status: 'RUNNING',
        startTime,
        endTime,
        durationMinutes,
        remainingSecondsWhenPaused: null,
      },
    });

    res.json({
      success: true,
      message: 'Event started successfully!',
      event: computeEventSummary(updated),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to start event.' });
  }
});

// Event Control: PAUSE
router.post('/event/pause', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const event = await getActiveEvent();
    if (event.status !== 'RUNNING') {
      res.status(400).json({ success: false, error: 'Event can only be paused while running.' });
      return;
    }

    const now = new Date();
    const remainingSeconds = event.endTime
      ? Math.max(0, Math.floor((event.endTime.getTime() - now.getTime()) / 1000))
      : event.durationMinutes * 60;

    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        status: 'PAUSED',
        remainingSecondsWhenPaused: remainingSeconds,
      },
    });

    res.json({
      success: true,
      message: 'Event PAUSED successfully. All submissions are temporarily frozen.',
      event: computeEventSummary(updated),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to pause event.' });
  }
});

// Event Control: RESUME
router.post('/event/resume', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const event = await getActiveEvent();
    if (event.status !== 'PAUSED') {
      res.status(400).json({ success: false, error: 'Event is not paused.' });
      return;
    }

    const remainingSecs = event.remainingSecondsWhenPaused ?? event.durationMinutes * 60;
    const now = new Date();
    const newEndTime = new Date(now.getTime() + remainingSecs * 1000);

    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        status: 'RUNNING',
        endTime: newEndTime,
        remainingSecondsWhenPaused: null,
      },
    });

    res.json({
      success: true,
      message: 'Event RESUMED successfully!',
      event: computeEventSummary(updated),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to resume event.' });
  }
});

// Event Control: END
router.post('/event/end', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const event = await getActiveEvent();
    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        status: 'ENDED',
        endTime: new Date(),
        remainingSecondsWhenPaused: 0,
      },
    });

    res.json({
      success: true,
      message: 'Event ENDED successfully.',
      event: computeEventSummary(updated),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to end event.' });
  }
});

// Event Control: RESET TIMER / DURATION
router.post('/event/reset-timer', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const event = await getActiveEvent();
    const minutes = parseDuration(req.body?.durationMinutes, 60);
    if (minutes === null) {
      res.status(400).json({ success: false, error: 'durationMinutes must be between 1 and 1440.' });
      return;
    }

    let startTime = null;
    let endTime = null;

    if (event.status === 'RUNNING') {
      startTime = new Date();
      endTime = new Date(startTime.getTime() + minutes * 60 * 1000);
    }

    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        durationMinutes: minutes,
        startTime,
        endTime,
        remainingSecondsWhenPaused: minutes * 60,
      },
    });

    res.json({
      success: true,
      message: `Timer reset to ${minutes} minutes.`,
      event: computeEventSummary(updated),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reset timer.' });
  }
});

// Event Control: TOGGLE LEADERBOARD VISIBILITY
router.post('/event/toggle-leaderboard', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const event = await getActiveEvent();
    const updated = await prisma.event.update({
      where: { id: event.id },
      data: { isLeaderboardVisible: !event.isLeaderboardVisible },
    });

    res.json({
      success: true,
      message: `Leaderboard is now ${updated.isLeaderboardVisible ? 'VISIBLE' : 'HIDDEN'} to participants.`,
      isLeaderboardVisible: updated.isLeaderboardVisible,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle leaderboard.' });
  }
});

// GET /api/admin/teams - List all teams with full details and progress
router.get('/teams', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: true,
        progress: {
          include: { challenge: true },
        },
        physicalFlags: true,
      },
      orderBy: { teamCode: 'asc' },
    });

    const formatted = teams.map((t) => {
      const capturedFlags = t.physicalFlags.filter((f) => f.isCaptured).length;
      const completedChallenges = t.progress.filter((p) => p.status === 'COMPLETED').length;
      const route = getTeamPhysicalRoute(t.routeIndex);

      return {
        id: t.id,
        teamCode: t.teamCode,
        teamName: t.teamName,
        captainName: t.captainName,
        email: t.email,
        score: t.score,
        onlineScore: t.onlineScore,
        physicalScore: t.physicalScore,
        completedCount: t.completedCount,
        metaCompleted: t.metaCompleted,
        lastSolveAt: t.lastSolveAt,
        routeIndex: t.routeIndex,
        route,
        members: t.members.map((m) => m.name),
        capturedFlags,
        completedChallenges,
        flags: t.physicalFlags.map((f) => ({
          flagCode: f.flagCode,
          fragment: f.fragment,
          isCaptured: f.isCaptured,
          capturedAt: f.capturedAt,
        })),
        progress: t.progress.map((p) => ({
          challengeCode: p.challenge.code,
          title: p.challenge.title,
          type: p.challenge.type,
          status: p.status,
          attempts: p.attempts,
          pointsEarned: p.pointsEarned,
          hint1Used: p.hint1Used,
          hint2Used: p.hint2Used,
        })),
      };
    });

    res.json({ success: true, teams: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch teams.' });
  }
});

// GET /api/admin/physical-flags - Printable / Master list of all team physical flags for organizers
router.get('/physical-flags', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const flags = await prisma.physicalFlag.findMany({
      include: {
        team: {
          select: { teamCode: true, teamName: true, captainName: true, routeIndex: true },
        },
        challenge: {
          select: { code: true, title: true, locationName: true, locationClue: true },
        },
      },
      orderBy: [{ challenge: { code: 'asc' } }, { team: { teamCode: 'asc' } }],
    });

    res.json({ success: true, flags });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch physical flags.' });
  }
});

// GET /api/admin/submissions - Live submissions feed
router.get('/submissions', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const submissions = await prisma.submission.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        team: { select: { teamCode: true, teamName: true } },
        challenge: { select: { code: true, title: true, type: true } },
      },
    });

    res.json({ success: true, submissions });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch submissions.' });
  }
});

// GET /api/admin/challenges - List all challenges
router.get('/challenges', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const challenges = await prisma.challenge.findMany({
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    });
    res.json({ success: true, challenges });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch challenges.' });
  }
});

// Admin Challenge Actions: RESET CHALLENGE FOR A TEAM
router.post('/challenges/:challengeId/reset-team', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { teamId } = req.body;

    if (!teamId) {
      res.status(400).json({ success: false, error: 'teamId is required.' });
      return;
    }

    const prog = await prisma.teamChallengeProgress.findUnique({
      where: { teamId_challengeId: { teamId, challengeId } },
      include: { challenge: true },
    });

    if (prog) {
      // If was completed, subtract points from the total AND the matching sub-score
      if (prog.status === 'COMPLETED') {
        const isPhysical = prog.challenge.type === 'PHYSICAL';
        await prisma.team.update({
          where: { id: teamId },
          data: {
            score: { decrement: prog.pointsEarned },
            ...(isPhysical
              ? { physicalScore: { decrement: prog.pointsEarned } }
              : { onlineScore: { decrement: prog.pointsEarned } }),
            completedCount: { decrement: 1 },
          },
        });
      }

      await prisma.teamChallengeProgress.update({
        where: { id: prog.id },
        data: {
          status: 'ACTIVE',
          attempts: 0,
          pointsEarned: 0,
          hint1Used: false,
          hint2Used: false,
          completedAt: null,
        },
      });

      // Also reset physical flag if applicable
      await prisma.physicalFlag.updateMany({
        where: { teamId, challengeId },
        data: { isCaptured: false, capturedAt: null },
      });
    }

    res.json({ success: true, message: 'Challenge progress reset for team.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reset challenge progress.' });
  }
});

// Admin Challenge Actions: UNLOCK CHALLENGE FOR A TEAM
router.post('/challenges/:challengeId/unlock-team', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { teamId } = req.body;

    if (!teamId) {
      res.status(400).json({ success: false, error: 'teamId is required.' });
      return;
    }

    await prisma.teamChallengeProgress.upsert({
      where: { teamId_challengeId: { teamId, challengeId } },
      update: { status: 'ACTIVE', attempts: 0 },
      create: { teamId, challengeId, status: 'ACTIVE', attempts: 0, startedAt: new Date() },
    });

    res.json({ success: true, message: 'Challenge unlocked for team.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to unlock challenge.' });
  }
});

// Admin Challenge Actions: TOGGLE ACTIVE / DISABLE CHALLENGE
router.post('/challenges/:challengeId/toggle-active', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { challengeId } = req.params;
    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      res.status(404).json({ success: false, error: 'Challenge not found.' });
      return;
    }

    const updated = await prisma.challenge.update({
      where: { id: challengeId },
      data: { isActive: !challenge.isActive },
    });

    res.json({
      success: true,
      message: `Challenge ${updated.code} is now ${updated.isActive ? 'ENABLED' : 'DISABLED'}.`,
      isActive: updated.isActive,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle challenge state.' });
  }
});

export default router;
