import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { getActiveEvent } from '../utils/eventHelper';

const router = Router();

// GET /api/leaderboard - Live leaderboard
router.get('/', async (_req: Request, res: Response) => {
  try {
    const event = await getActiveEvent();

    if (!event.isLeaderboardVisible) {
      res.json({
        success: true,
        isVisible: false,
        message: 'The leaderboard is currently hidden by the organizers.',
        leaderboard: [],
      });
      return;
    }

    // Fetch all teams with their progress count
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        teamCode: true,
        teamName: true,
        captainName: true,
        score: true,
        onlineScore: true,
        physicalScore: true,
        completedCount: true,
        metaCompleted: true,
        metaCompletedAt: true,
        lastSolveAt: true,
        createdAt: true,
        members: {
          select: { name: true },
        },
        physicalFlags: {
          where: { isCaptured: true },
          select: { id: true },
        },
      },
      orderBy: [
        { score: 'desc' },
        { completedCount: 'desc' },
        { lastSolveAt: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'asc' },
      ],
    });

    const leaderboard = teams.map((team, idx) => ({
      rank: idx + 1,
      teamCode: team.teamCode,
      teamName: team.teamName,
      captainName: team.captainName,
      score: team.score,
      onlineScore: team.onlineScore,
      physicalScore: team.physicalScore,
      completedChallenges: team.completedCount,
      physicalFlagsCaptured: team.physicalFlags.length,
      metaCompleted: team.metaCompleted,
      lastSolveAt: team.lastSolveAt ? team.lastSolveAt.toISOString() : null,
      members: team.members.map((m) => m.name),
    }));

    res.json({
      success: true,
      isVisible: true,
      totalTeams: leaderboard.length,
      leaderboard,
    });
  } catch (err: any) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard.' });
  }
});

export default router;
