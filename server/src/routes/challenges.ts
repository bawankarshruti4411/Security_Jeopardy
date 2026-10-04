import { Router, Response } from 'express';
import { z } from 'zod';
import { Challenge, TeamChallengeProgress } from '@prisma/client';
import { prisma } from '../prisma';
import { requireTeam } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { getActiveEvent, computeEventSummary } from '../utils/eventHelper';
import { isAnswerCorrect } from '../utils/answerChecker';

const router = Router();

const MAX_ATTEMPTS = 3;

// A riddle is "finished" once it is solved OR its attempts are exhausted.
// Either way the next riddle opens — a failed riddle only locks itself.
const FINISHED_STATUSES = ['COMPLETED', 'FAILED'];

const submitSchema = z.object({
  answer: z.string().trim().min(1, 'Answer cannot be empty'),
});

const hintSchema = z.object({
  hintNumber: z.union([z.literal(1), z.literal(2)]),
});

function findOnlineChallenge(idOrCode: string) {
  return prisma.challenge.findFirst({
    where: {
      type: 'ONLINE',
      isActive: true,
      OR: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }],
    },
  });
}

/**
 * Activates a LOCKED (or missing) progress record. Never touches a record that
 * is already ACTIVE / COMPLETED / FAILED.
 */
async function activateProgress(teamId: string, challengeId: string): Promise<TeamChallengeProgress> {
  const existing = await prisma.teamChallengeProgress.findUnique({
    where: { teamId_challengeId: { teamId, challengeId } },
  });
  if (existing && existing.status !== 'LOCKED') return existing;

  return prisma.teamChallengeProgress.upsert({
    where: { teamId_challengeId: { teamId, challengeId } },
    update: { status: 'ACTIVE', startedAt: new Date() },
    create: { teamId, challengeId, status: 'ACTIVE', startedAt: new Date() },
  });
}

/**
 * Returns the team's progress for a challenge, unlocking it if the previous
 * (active) online challenge has been finished (solved or failed).
 */
async function getUnlockedProgress(
  teamId: string,
  challenge: Challenge
): Promise<TeamChallengeProgress | null> {
  const progress = await prisma.teamChallengeProgress.findUnique({
    where: { teamId_challengeId: { teamId, challengeId: challenge.id } },
  });
  if (progress && progress.status !== 'LOCKED') return progress;

  const previous = await prisma.challenge.findFirst({
    where: { type: 'ONLINE', isActive: true, order: { lt: challenge.order } },
    orderBy: { order: 'desc' },
  });

  if (previous) {
    const prevProgress = await prisma.teamChallengeProgress.findUnique({
      where: { teamId_challengeId: { teamId, challengeId: previous.id } },
    });
    if (!prevProgress || !FINISHED_STATUSES.includes(prevProgress.status)) {
      return null;
    }
  }

  return activateProgress(teamId, challenge.id);
}

/** Unlocks the next active online challenge after `order`, if any. */
async function unlockNextOnline(teamId: string, order: number): Promise<Challenge | null> {
  const next = await prisma.challenge.findFirst({
    where: { type: 'ONLINE', isActive: true, order: { gt: order } },
    orderBy: { order: 'asc' },
  });
  if (next) {
    await activateProgress(teamId, next.id);
  }
  return next;
}

// GET /api/challenges - Get all online challenges with team progress
router.get('/', requireTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = req.user!.id;

    const challenges = await prisma.challenge.findMany({
      where: { type: 'ONLINE', isActive: true },
      orderBy: { order: 'asc' },
    });

    const progressRecords = await prisma.teamChallengeProgress.findMany({
      where: { teamId },
    });
    const progressMap = new Map(progressRecords.map((p) => [p.challengeId, p]));

    // Walk the challenges in order. Any challenge whose predecessor is finished
    // (solved or failed) is unlocked. This also repairs teams that were left
    // stuck by the old behaviour where a failed riddle locked everything after it.
    let previousFinished = true;
    for (const c of challenges) {
      const prog = progressMap.get(c.id);
      if (previousFinished && (!prog || prog.status === 'LOCKED')) {
        progressMap.set(c.id, await activateProgress(teamId, c.id));
      }
      const status = progressMap.get(c.id)?.status ?? 'LOCKED';
      previousFinished = FINISHED_STATUSES.includes(status);
    }

    // Format safe payload (NO ANSWERS EXPOSED)
    const sanitized = challenges.map((c) => {
      const prog = progressMap.get(c.id);

      const status = prog ? prog.status : 'LOCKED';
      const attempts = prog ? prog.attempts : 0;
      const hint1Used = prog ? prog.hint1Used : false;
      const hint2Used = prog ? prog.hint2Used : false;
      const pointsEarned = prog ? prog.pointsEarned : 0;

      const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - attempts);
      return {
        id: c.id,
        code: c.code,
        title: c.title,
        type: c.type,
        difficulty: c.difficulty,
        description: status === 'LOCKED' ? null : c.description,
        points: c.points,
        order: c.order,
        status,
        attempts,
        maxAttempts: MAX_ATTEMPTS,
        attemptsRemaining,
        hint1Penalty: c.hint1Penalty,
        hint2Penalty: c.hint2Penalty,
        hint1: hint1Used ? c.hint1 : null,
        hint2: hint2Used ? c.hint2 : null,
        hint1Used,
        hint2Used,
        pointsEarned,
      };
    });

    res.json({ success: true, challenges: sanitized });
  } catch (err: any) {
    console.error('Error fetching online challenges:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch challenges.' });
  }
});

// POST /api/challenges/:id/hint - Request Hint 1 or Hint 2
router.post('/:id/hint', requireTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = req.user!.id;
    const challengeId = req.params.id;

    const event = await getActiveEvent();
    const eventSummary = computeEventSummary(event);
    if (!eventSummary.canSubmit) {
      res.status(400).json({
        success: false,
        error: `Action forbidden. Event is ${eventSummary.status}.`,
      });
      return;
    }

    const parseResult = hintSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'hintNumber must be 1 or 2' });
      return;
    }
    const { hintNumber } = parseResult.data;

    const challenge = await findOnlineChallenge(challengeId);
    if (!challenge) {
      res.status(404).json({ success: false, error: 'Challenge not found.' });
      return;
    }

    const progress = await getUnlockedProgress(teamId, challenge);

    if (!progress || progress.status === 'LOCKED') {
      res.status(403).json({ success: false, error: 'This challenge is currently locked.' });
      return;
    }

    if (progress.status === 'COMPLETED') {
      res.status(400).json({ success: false, error: 'Challenge is already completed.' });
      return;
    }

    if (progress.status === 'FAILED') {
      res.status(400).json({ success: false, error: 'Maximum attempts reached for this challenge.' });
      return;
    }

    let updatedProgress = progress;
    let hintText = '';

    if (hintNumber === 1) {
      if (!progress.hint1Used) {
        updatedProgress = await prisma.teamChallengeProgress.update({
          where: { id: progress.id },
          data: { hint1Used: true },
        });
      }
      hintText = challenge.hint1;
    } else if (hintNumber === 2) {
      if (!progress.hint1Used) {
        res.status(400).json({ success: false, error: 'You must reveal Hint 1 before Hint 2.' });
        return;
      }
      if (!progress.hint2Used) {
        updatedProgress = await prisma.teamChallengeProgress.update({
          where: { id: progress.id },
          data: { hint2Used: true },
        });
      }
      hintText = challenge.hint2;
    }

    res.json({
      success: true,
      hintNumber,
      hintText,
      hint1Used: updatedProgress.hint1Used,
      hint2Used: updatedProgress.hint2Used,
    });
  } catch (err: any) {
    console.error('Hint error:', err);
    res.status(500).json({ success: false, error: 'Failed to unlock hint.' });
  }
});

// POST /api/challenges/:id/submit - Submit answer to an online challenge
router.post('/:id/submit', requireTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = req.user!.id;
    const challengeId = req.params.id;

    // Check server-authoritative timer / event status
    const event = await getActiveEvent();
    const eventSummary = computeEventSummary(event);
    if (!eventSummary.canSubmit) {
      res.status(400).json({
        success: false,
        error: `Submission rejected: Event is ${eventSummary.status}.`,
      });
      return;
    }

    const parseResult = submitSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'Please enter a valid answer.' });
      return;
    }
    const { answer } = parseResult.data;

    const challenge = await findOnlineChallenge(challengeId);
    if (!challenge) {
      res.status(404).json({ success: false, error: 'Challenge not found.' });
      return;
    }

    const progress = await getUnlockedProgress(teamId, challenge);

    if (!progress || progress.status === 'LOCKED') {
      res.status(403).json({ success: false, error: 'This challenge is currently locked.' });
      return;
    }

    if (progress.status === 'COMPLETED') {
      res.status(400).json({ success: false, error: 'Challenge already completed.' });
      return;
    }

    if (progress.status === 'FAILED' || progress.attempts >= MAX_ATTEMPTS) {
      res.status(400).json({
        success: false,
        error: 'Maximum attempts reached. Challenge is locked.',
      });
      return;
    }

    const isCorrect = isAnswerCorrect(answer, challenge.answer, challenge.acceptedAnswers);
    const newAttemptCount = progress.attempts + 1;
    const isNowFailed = !isCorrect && newAttemptCount >= MAX_ATTEMPTS;

    let pointsEarned = 0;
    if (isCorrect) {
      let penalty = 0;
      if (progress.hint1Used) penalty += challenge.hint1Penalty;
      if (progress.hint2Used) penalty += challenge.hint2Penalty;
      pointsEarned = Math.max(0, challenge.points - penalty);
    }

    // Claim this attempt atomically: only succeeds if nobody else changed the
    // record since we read it. Prevents double-scoring / extra attempts when
    // the same team submits concurrently from several devices.
    const claimed = await prisma.teamChallengeProgress.updateMany({
      where: { id: progress.id, status: 'ACTIVE', attempts: progress.attempts },
      data: isCorrect
        ? { status: 'COMPLETED', attempts: newAttemptCount, pointsEarned, completedAt: new Date() }
        : { status: isNowFailed ? 'FAILED' : 'ACTIVE', attempts: newAttemptCount },
    });

    if (claimed.count === 0) {
      res.status(409).json({
        success: false,
        error: 'Another submission for this challenge was just processed. Please refresh.',
      });
      return;
    }

    // Record submission history
    await prisma.submission.create({
      data: {
        teamId,
        challengeId: challenge.id,
        submissionType: 'RIDDLE',
        submittedAnswer: answer,
        isCorrect,
      },
    });

    if (isCorrect) {
      // Update team total score and completed count
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: {
          score: { increment: pointsEarned },
          onlineScore: { increment: pointsEarned },
          completedCount: { increment: 1 },
          lastSolveAt: new Date(),
        },
      });

      const nextChallenge = await unlockNextOnline(teamId, challenge.order);

      res.json({
        success: true,
        correct: true,
        isCorrect: true,
        message: 'Correct! Challenge solved.',
        pointsEarned,
        totalScore: updatedTeam.score,
        attempts: newAttemptCount,
        nextChallenge: nextChallenge ? nextChallenge.code : null,
        nextUnlocked: nextChallenge ? nextChallenge.code : null,
      });
      return;
    }

    // Incorrect answer. If this was the final attempt, only THIS challenge is
    // locked — the next one is opened so the team can keep playing.
    const nextChallenge = isNowFailed ? await unlockNextOnline(teamId, challenge.order) : null;

    const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - newAttemptCount);
    const failedMessage = nextChallenge
      ? `Incorrect answer. Maximum attempts reached — this challenge is locked. ${nextChallenge.code} is now unlocked.`
      : 'Incorrect answer. Maximum attempts reached. Challenge is locked.';
    res.json({
      success: false,
      correct: false,
      isCorrect: false,
      message: isNowFailed ? failedMessage : 'Incorrect answer. Try again.',
      error: isNowFailed
        ? failedMessage
        : `Incorrect answer. Try again. (${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining)`,
      attempts: newAttemptCount,
      attemptsRemaining,
      isLocked: isNowFailed,
      nextUnlocked: nextChallenge ? nextChallenge.code : null,
    });
  } catch (err: any) {
    console.error('Submission error:', err);
    res.status(500).json({ success: false, error: 'Internal server error processing submission.' });
  }
});

export default router;
