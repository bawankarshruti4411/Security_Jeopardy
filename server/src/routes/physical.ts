import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireTeam } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { getActiveEvent, computeEventSummary } from '../utils/eventHelper';
import { isAnswerCorrect, normalizeAnswer } from '../utils/answerChecker';
import { getTeamPhysicalRoute } from '../utils/routesHelper';

const router = Router();

// A route step is "finished" once its flag is captured OR its riddle failed
// (3 wrong answers). Either way the next step opens — a failed riddle only
// locks itself.
const FINISHED_STATUSES = ['COMPLETED', 'FAILED'];

/** Opens the step after `code` in the team's route, if it is still LOCKED. */
async function unlockNextPhysical(teamId: string, routeIndex: number, code: string): Promise<string | null> {
  const routeCodes = getTeamPhysicalRoute(routeIndex);
  const currentIndex = routeCodes.indexOf(code);
  if (currentIndex === -1 || currentIndex + 1 >= routeCodes.length) return null;

  const nextCode = routeCodes[currentIndex + 1];
  const nextChallenge = await prisma.challenge.findUnique({ where: { code: nextCode } });
  if (!nextChallenge) return null;

  const existing = await prisma.teamChallengeProgress.findUnique({
    where: { teamId_challengeId: { teamId, challengeId: nextChallenge.id } },
  });
  if (!existing) {
    await prisma.teamChallengeProgress.create({
      data: { teamId, challengeId: nextChallenge.id, status: 'ACTIVE', startedAt: new Date() },
    });
  } else if (existing.status === 'LOCKED') {
    await prisma.teamChallengeProgress.update({
      where: { id: existing.id },
      data: { status: 'ACTIVE', startedAt: new Date() },
    });
  }
  return nextCode;
}

const riddleSubmitSchema = z.object({
  answer: z.string().trim().min(1, 'Answer cannot be empty'),
});

const flagSubmitSchema = z.object({
  flagCode: z.string().trim().min(1, 'Flag code cannot be empty'),
});

const metaSubmitSchema = z.object({
  answer: z.string().trim().min(1, 'Meta answer cannot be empty'),
});

// GET /api/physical - Get physical challenges according to team's rotating route
router.get('/', requireTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = req.user!.id;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        physicalFlags: true,
      },
    });

    if (!team) {
      res.status(404).json({ success: false, error: 'Team not found.' });
      return;
    }

    // Get all physical challenges
    const allPhysical = await prisma.challenge.findMany({
      where: { type: 'PHYSICAL', isActive: true },
    });
    const challengeMap = new Map(allPhysical.map((c) => [c.code, c]));

    // Calculate team's rotating route
    const routeCodes = getTeamPhysicalRoute(team.routeIndex);

    // Get progress records for team
    const progressRecords = await prisma.teamChallengeProgress.findMany({
      where: { teamId },
    });
    const progressMap = new Map(progressRecords.map((p) => [p.challengeId, p]));

    // Determine current active step in the route
    // The route is an ordered list: [Code1, Code2, Code3, Code4, Code5]
    let firstIncompleteFound = false;

    const routeChallenges = routeCodes.map((code, stepIndex) => {
      const challenge = challengeMap.get(code);
      if (!challenge) return null;

      let prog = progressMap.get(challenge.id);
      let status = prog ? prog.status : 'LOCKED';

      // Auto-unlock first challenge in route if nothing has started
      if (stepIndex === 0 && (!prog || prog.status === 'LOCKED')) {
        status = 'ACTIVE';
      }

      // Check if previous step was completed to unlock current
      if (stepIndex > 0) {
        const prevCode = routeCodes[stepIndex - 1];
        const prevChallenge = challengeMap.get(prevCode);
        const prevProg = prevChallenge ? progressMap.get(prevChallenge.id) : null;
        if (prevProg && FINISHED_STATUSES.includes(prevProg.status) && (!prog || prog.status === 'LOCKED')) {
          status = 'ACTIVE';
        }
      }

      const isCompleted = status === 'COMPLETED';
      const isRiddleSolved = status === 'RIDDLE_SOLVED' || isCompleted;

      // Only reveal location clue if riddle is solved!
      const showLocation = isRiddleSolved;

      // Find team's flag fragment if completed
      const flagRecord = team.physicalFlags.find((f) => f.challengeId === challenge.id);
      const isCaptured = flagRecord?.isCaptured ?? false;

      return {
        id: challenge.id,
        code: challenge.code,
        title: challenge.title,
        difficulty: challenge.difficulty,
        points: challenge.points,
        stepIndex: stepIndex + 1,
        status,
        isRiddleSolved,
        isCaptured,
        fragment: isCaptured ? challenge.physicalFragment : null,
        description: status === 'LOCKED' ? null : challenge.description,
        locationClue: showLocation ? challenge.locationClue : null,
        locationName: showLocation ? challenge.locationName : null,
        attempts: prog ? prog.attempts : 0,
        maxAttempts: 3,
        attemptsRemaining: Math.max(0, 3 - (prog ? prog.attempts : 0)),
        hint1Used: prog ? prog.hint1Used : false,
        hint2Used: prog ? prog.hint2Used : false,
        hint1Penalty: challenge.hint1Penalty,
        hint2Penalty: challenge.hint2Penalty,
        hint1: prog?.hint1Used ? challenge.hint1 : null,
        hint2: prog?.hint2Used ? challenge.hint2 : null,
        pointsEarned: prog ? prog.pointsEarned : 0,
      };
    }).filter(Boolean);

    // Collect all captured fragments
    const capturedFragments = team.physicalFlags
      .filter((f) => f.isCaptured)
      .map((f) => f.fragment);

    const allPhysicalCompleted = routeChallenges.every((c) => c?.status === 'COMPLETED');

    res.json({
      success: true,
      route: routeChallenges,
      capturedCount: capturedFragments.length,
      totalPhysical: 5,
      capturedFragments,
      allPhysicalCompleted,
      metaCompleted: team.metaCompleted,
    });
  } catch (err: any) {
    console.error('Error fetching physical challenges:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch physical challenge data.' });
  }
});

// POST /api/physical/:id/submit-riddle - Solve online riddle for physical challenge
router.post('/:id/submit-riddle', requireTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = req.user!.id;
    const challengeId = req.params.id;

    const event = await getActiveEvent();
    const eventSummary = computeEventSummary(event);
    if (!eventSummary.canSubmit) {
      res.status(400).json({
        success: false,
        error: `Submission rejected: Event is ${eventSummary.status}.`,
      });
      return;
    }

    const parseResult = riddleSubmitSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'Answer cannot be empty.' });
      return;
    }
    const { answer } = parseResult.data;

    const challenge = await prisma.challenge.findFirst({
      where: {
        type: 'PHYSICAL',
        isActive: true,
        OR: [{ id: challengeId }, { code: challengeId.toUpperCase() }],
      },
    });
    if (!challenge) {
      res.status(404).json({ success: false, error: 'Physical challenge not found.' });
      return;
    }

    let progress = await prisma.teamChallengeProgress.findUnique({
      where: { teamId_challengeId: { teamId, challengeId: challenge.id } },
    });

    if (!progress || progress.status === 'LOCKED') {
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (team) {
        const routeCodes = getTeamPhysicalRoute(team.routeIndex);
        const stepIndex = routeCodes.indexOf(challenge.code as any);
        let canActivate = false;
        if (stepIndex === 0) {
          canActivate = true;
        } else if (stepIndex > 0) {
          const prevCode = routeCodes[stepIndex - 1];
          const prevChallenge = await prisma.challenge.findUnique({ where: { code: prevCode } });
          const prevProg = prevChallenge
            ? await prisma.teamChallengeProgress.findUnique({
                where: { teamId_challengeId: { teamId, challengeId: prevChallenge.id } },
              })
            : null;
          if (prevProg && FINISHED_STATUSES.includes(prevProg.status)) {
            canActivate = true;
          }
        }

        if (canActivate) {
          progress = await prisma.teamChallengeProgress.upsert({
            where: { teamId_challengeId: { teamId, challengeId: challenge.id } },
            update: { status: 'ACTIVE', startedAt: new Date() },
            create: { teamId, challengeId: challenge.id, status: 'ACTIVE', startedAt: new Date() },
          });
        }
      }
    }

    if (!progress || progress.status === 'LOCKED') {
      res.status(403).json({ success: false, error: 'This physical challenge is not unlocked yet.' });
      return;
    }

    if (progress.status === 'RIDDLE_SOLVED' || progress.status === 'COMPLETED') {
      res.status(400).json({
        success: false,
        error: 'Riddle already solved. Proceed to locate physical flag!',
      });
      return;
    }

    if (progress.status === 'FAILED' || progress.attempts >= 3) {
      res.status(400).json({
        success: false,
        error: 'Maximum attempts reached for this riddle.',
      });
      return;
    }

    const isCorrect = isAnswerCorrect(answer, challenge.answer, challenge.acceptedAnswers);
    const newAttemptCount = progress.attempts + 1;
    const isFailed = !isCorrect && newAttemptCount >= 3;

    // Claim the attempt atomically so concurrent submissions can't exceed 3 attempts
    const claimed = await prisma.teamChallengeProgress.updateMany({
      where: { id: progress.id, status: 'ACTIVE', attempts: progress.attempts },
      data: {
        attempts: newAttemptCount,
        status: isCorrect ? 'RIDDLE_SOLVED' : isFailed ? 'FAILED' : 'ACTIVE',
      },
    });
    if (claimed.count === 0) {
      res.status(409).json({
        success: false,
        error: 'Another submission for this riddle was just processed. Please refresh.',
      });
      return;
    }

    // Record submission
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
      res.json({
        success: true,
        isCorrect: true,
        message: 'Riddle solved! Location clue revealed.',
        locationClue: challenge.locationClue,
        locationName: challenge.locationName,
      });
      return;
    } else {
      // On the final wrong attempt only THIS step is locked; open the next one.
      let nextUnlocked: string | null = null;
      if (isFailed) {
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (team) nextUnlocked = await unlockNextPhysical(teamId, team.routeIndex, challenge.code);
      }

      const remaining = Math.max(0, 3 - newAttemptCount);
      const failedMessage = nextUnlocked
        ? `Incorrect answer. Maximum attempts reached — this step is locked. Next step (${nextUnlocked}) is now unlocked.`
        : 'Incorrect answer. Maximum attempts reached. This step is locked.';
      res.json({
        success: false,
        isCorrect: false,
        error: isFailed
          ? failedMessage
          : `Incorrect answer. Try again. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`,
        attemptsRemaining: remaining,
        isLocked: isFailed,
        nextUnlocked,
      });
      return;
    }
  } catch (err: any) {
    console.error('Physical riddle error:', err);
    res.status(500).json({ success: false, error: 'Error submitting physical riddle answer.' });
  }
});

// POST /api/physical/:id/submit-flag - Submit physical flag code
router.post('/:id/submit-flag', requireTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = req.user!.id;
    const challengeId = req.params.id;

    // Check event status
    const event = await getActiveEvent();
    const eventSummary = computeEventSummary(event);
    if (!eventSummary.canSubmit) {
      res.status(400).json({
        success: false,
        error: `Submission rejected: Event is ${eventSummary.status}.`,
      });
      return;
    }

    const parseResult = flagSubmitSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'Please enter a flag code.' });
      return;
    }
    const submittedFlag = normalizeAnswer(parseResult.data.flagCode);

    const challenge = await prisma.challenge.findFirst({
      where: {
        type: 'PHYSICAL',
        isActive: true,
        OR: [{ id: challengeId }, { code: challengeId.toUpperCase() }],
      },
    });
    if (!challenge) {
      res.status(404).json({ success: false, error: 'Challenge not found.' });
      return;
    }

    const progress = await prisma.teamChallengeProgress.findUnique({
      where: { teamId_challengeId: { teamId, challengeId: challenge.id } },
    });

    if (!progress) {
      res.status(403).json({
        success: false,
        error: 'This physical challenge is not available yet.',
      });
      return;
    }

    if (progress.status === 'COMPLETED') {
      res.status(400).json({ success: false, error: 'Flag already captured.' });
      return;
    }

    if (progress.status === 'FAILED') {
      res.status(403).json({
        success: false,
        error: 'This step is locked: all 3 riddle attempts were used. Continue with your next step.',
      });
      return;
    }

    if (progress.status !== 'RIDDLE_SOLVED') {
      res.status(403).json({
        success: false,
        error: 'You must solve the online riddle before submitting this physical flag.',
      });
      return;
    }

    // Look for the submitted flag code in database
    const matchingFlag = await prisma.physicalFlag.findUnique({
      where: { flagCode: submittedFlag },
      include: { team: true },
    });

    // Check anti-cheating: Does flag belong to ANOTHER team?
    if (matchingFlag && matchingFlag.teamId !== teamId) {
      // Record malicious/cross-team submission
      await prisma.submission.create({
        data: {
          teamId,
          challengeId: challenge.id,
          submissionType: 'PHYSICAL_FLAG',
          submittedAnswer: submittedFlag,
          isCorrect: false,
          feedback: `Cross-team flag attempted! Belongs to ${matchingFlag.team.teamCode}`,
        },
      });

      res.status(403).json({
        success: false,
        isCorrect: false,
        error: 'THIS FLAG BELONGS TO ANOTHER TEAM. Points are not awarded.',
      });
      return;
    }

    // Check if valid flag for this team and challenge
    const teamFlag = await prisma.physicalFlag.findUnique({
      where: {
        teamId_challengeId: { teamId, challengeId: challenge.id },
      },
    });

    if (!teamFlag || normalizeAnswer(teamFlag.flagCode) !== submittedFlag) {
      await prisma.submission.create({
        data: {
          teamId,
          challengeId: challenge.id,
          submissionType: 'PHYSICAL_FLAG',
          submittedAnswer: submittedFlag,
          isCorrect: false,
          feedback: 'Invalid physical flag code',
        },
      });

      res.status(400).json({
        success: false,
        isCorrect: false,
        error: 'Invalid flag code. Verify your team code and flag format.',
      });
      return;
    }

    // Valid flag!
    // Calculate points (20 pts minus riddle hint penalties if any)
    let penalty = 0;
    if (progress.hint1Used) penalty += challenge.hint1Penalty;
    if (progress.hint2Used) penalty += challenge.hint2Penalty;
    const pointsEarned = Math.max(0, challenge.points - penalty);

    // Mark challenge COMPLETED atomically so a double-submit can't score twice
    const claimed = await prisma.teamChallengeProgress.updateMany({
      where: { id: progress.id, status: 'RIDDLE_SOLVED' },
      data: {
        status: 'COMPLETED',
        pointsEarned,
        completedAt: new Date(),
      },
    });
    if (claimed.count === 0) {
      res.status(400).json({ success: false, error: 'Flag already captured.' });
      return;
    }

    // Update physical flag as captured
    await prisma.physicalFlag.update({
      where: { id: teamFlag.id },
      data: {
        isCaptured: true,
        capturedAt: new Date(),
      },
    });

    // Update team score
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        score: { increment: pointsEarned },
        physicalScore: { increment: pointsEarned },
        completedCount: { increment: 1 },
        lastSolveAt: new Date(),
      },
      include: { physicalFlags: true },
    });

    // Record correct submission
    await prisma.submission.create({
      data: {
        teamId,
        challengeId: challenge.id,
        submissionType: 'PHYSICAL_FLAG',
        submittedAnswer: submittedFlag,
        isCorrect: true,
        feedback: `Captured fragment: ${teamFlag.fragment}`,
      },
    });

    // Unlock next physical challenge in rotating route
    const nextChallengeCode = await unlockNextPhysical(teamId, updatedTeam.routeIndex, challenge.code);

    const totalCaptured = updatedTeam.physicalFlags.filter((f) => f.isCaptured).length;
    const allCaptured = totalCaptured >= 5;

    res.json({
      success: true,
      isCorrect: true,
      message: `FLAG CAPTURED! Fragment obtained: "${teamFlag.fragment}"`,
      fragment: teamFlag.fragment,
      pointsEarned,
      totalScore: updatedTeam.score,
      totalCaptured,
      allCaptured,
      nextUnlocked: nextChallengeCode,
    });
  } catch (err: any) {
    console.error('Flag submission error:', err);
    res.status(500).json({ success: false, error: 'Internal server error processing physical flag.' });
  }
});

// POST /api/physical/submit-meta - Final meta challenge (CYBER)
router.post('/submit-meta', requireTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamId = req.user!.id;

    const event = await getActiveEvent();
    const eventSummary = computeEventSummary(event);
    if (!eventSummary.canSubmit) {
      res.status(400).json({
        success: false,
        error: `Submission rejected: Event is ${eventSummary.status}.`,
      });
      return;
    }

    const parseResult = metaSubmitSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'Answer cannot be empty.' });
      return;
    }
    const { answer } = parseResult.data;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { physicalFlags: true },
    });

    if (!team) {
      res.status(404).json({ success: false, error: 'Team not found.' });
      return;
    }

    // Verify all 5 physical flags are captured
    const capturedCount = team.physicalFlags.filter((f) => f.isCaptured).length;
    if (capturedCount < 5) {
      res.status(403).json({
        success: false,
        error: 'You must capture all 5 physical flags before submitting the final meta challenge.',
      });
      return;
    }

    if (team.metaCompleted) {
      res.status(400).json({
        success: false,
        error: 'Meta challenge already completed!',
      });
      return;
    }

    const isCorrect = normalizeAnswer(answer) === 'CYBER';

    await prisma.submission.create({
      data: {
        teamId,
        submissionType: 'META',
        submittedAnswer: answer,
        isCorrect,
      },
    });

    if (isCorrect) {
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: {
          metaCompleted: true,
          metaCompletedAt: new Date(),
          lastSolveAt: new Date(),
        },
      });

      res.json({
        success: true,
        isCorrect: true,
        message: 'MISSION COMPLETE! Final meta challenge solved.',
        finalScore: updatedTeam.score,
        metaCompleted: true,
      });
      return;
    } else {
      res.status(400).json({
        success: false,
        isCorrect: false,
        error: 'Incorrect final answer. Rearrange your 5 fragments: C + Y + B + E + R.',
      });
      return;
    }
  } catch (err: any) {
    console.error('Meta submit error:', err);
    res.status(500).json({ success: false, error: 'Error submitting meta challenge.' });
  }
});

export default router;
