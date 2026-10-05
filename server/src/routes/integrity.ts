import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireTeam } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { getActiveEvent, computeEventSummary } from '../utils/eventHelper';

const router = Router();

export const MAX_VIOLATIONS = 3;

// One tab switch often fires several browser events (blur + visibilitychange +
// fullscreenchange). Count them as a single violation.
const DEBOUNCE_MS = 3000;

const violationSchema = z.object({
  type: z.enum(['TAB_HIDDEN', 'WINDOW_BLUR', 'FULLSCREEN_EXIT']),
});

/**
 * Route guard for answer/flag/hint endpoints: a team locked for repeated tab
 * switching cannot act until an admin unlocks it.
 */
export function requireUnlockedTeam(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireTeam(req, res, async () => {
    try {
      const team = await prisma.team.findUnique({
        where: { id: req.user!.id },
        select: { isLocked: true },
      });
      if (team?.isLocked) {
        res.status(423).json({
          success: false,
          isLocked: true,
          error: 'Your team is locked for leaving the competition window. Ask an organizer to unlock you.',
        });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  });
}

// GET /api/integrity/status - current violation state for the logged-in team
router.get('/status', requireTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.user!.id },
      select: { violationCount: true, isLocked: true },
    });
    if (!team) {
      res.status(404).json({ success: false, error: 'Team not found.' });
      return;
    }
    res.json({ success: true, ...team, maxViolations: MAX_VIOLATIONS });
  } catch (err) {
    console.error('Integrity status error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch integrity status.' });
  }
});

// POST /api/integrity/violation - report a tab switch / fullscreen exit
router.post('/violation', requireTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = req.user!.id;

    const parseResult = violationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'Invalid violation type.' });
      return;
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { violationCount: true, isLocked: true },
    });
    if (!team) {
      res.status(404).json({ success: false, error: 'Team not found.' });
      return;
    }

    // Only counts while the competition is actually running
    const eventSummary = computeEventSummary(await getActiveEvent());
    if (eventSummary.status !== 'RUNNING' || team.isLocked) {
      res.json({ success: true, counted: false, ...team, maxViolations: MAX_VIOLATIONS });
      return;
    }

    const recent = await prisma.violation.findFirst({
      where: { teamId, createdAt: { gt: new Date(Date.now() - DEBOUNCE_MS) } },
    });
    if (recent) {
      res.json({ success: true, counted: false, ...team, maxViolations: MAX_VIOLATIONS });
      return;
    }

    await prisma.violation.create({ data: { teamId, type: parseResult.data.type } });
    const updated = await prisma.team.update({
      where: { id: teamId },
      data: { violationCount: { increment: 1 } },
      select: { violationCount: true, isLocked: true },
    });

    let isLocked = updated.isLocked;
    if (updated.violationCount >= MAX_VIOLATIONS && !isLocked) {
      await prisma.team.update({ where: { id: teamId }, data: { isLocked: true } });
      isLocked = true;
    }

    res.json({
      success: true,
      counted: true,
      violationCount: updated.violationCount,
      isLocked,
      maxViolations: MAX_VIOLATIONS,
    });
  } catch (err) {
    console.error('Violation report error:', err);
    res.status(500).json({ success: false, error: 'Failed to record violation.' });
  }
});

export default router;
