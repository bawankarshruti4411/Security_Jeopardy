import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma';
import { config } from '../config';
import { formatTeamCode, parseTeamCodeNumber } from '../utils/routesHelper';
import { authenticateJwt } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

const registerSchema = z.object({
  teamName: z.string().trim().min(2, 'Team name must be at least 2 characters'),
  captainName: z.string().trim().min(2, 'Captain name must be at least 2 characters'),
  memberNames: z.union([
    z.array(z.string().trim().min(1)),
    z.string().transform((val) => val.split(',').map((s) => s.trim()).filter(Boolean)),
  ]),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  teamCode: z.string().trim().toUpperCase(),
  password: z.string(),
});

const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string(),
});

// POST /api/auth/register-team
router.post('/register-team', async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    const { teamName, captainName, memberNames, email, password } = parseResult.data;

    // Check duplicate team name or email
    const existingTeam = await prisma.team.findFirst({
      where: {
        OR: [
          { teamName: { equals: teamName, mode: 'insensitive' } },
          { email: { equals: email, mode: 'insensitive' } },
        ],
      },
    });

    if (existingTeam) {
      res.status(409).json({
        success: false,
        error: 'A team with this name or email is already registered.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Determine next team code. Retry if two registrations race for the same code.
    let team: Awaited<ReturnType<typeof prisma.team.create>> | null = null;
    for (let attempt = 0; attempt < 5 && !team; attempt++) {
      const allTeams = await prisma.team.findMany({ select: { teamCode: true } });
      let maxNumber = 0;
      for (const t of allTeams) {
        const num = parseTeamCodeNumber(t.teamCode);
        if (num > maxNumber) maxNumber = num;
      }
      const nextNumber = maxNumber + 1;
      try {
        team = await prisma.team.create({
          data: {
            teamCode: formatTeamCode(nextNumber),
            teamName,
            captainName,
            email,
            passwordHash,
            routeIndex: (nextNumber - 1) % 5,
          },
        });
      } catch (err: any) {
        if (err?.code !== 'P2002') throw err; // unique teamCode collision -> retry
      }
    }
    if (!team) {
      res.status(503).json({ success: false, error: 'Registration is busy, please try again.' });
      return;
    }

    // Create members
    const membersToCreate = Array.from(new Set([captainName, ...memberNames]));
    for (const name of membersToCreate) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          name,
        },
      });
    }

    // Initialize challenge progress for all existing challenges
    const allChallenges = await prisma.challenge.findMany();
    for (const c of allChallenges) {
      const isFirst = c.code === 'O01';
      await prisma.teamChallengeProgress.create({
        data: {
          teamId: team.id,
          challengeId: c.id,
          status: isFirst ? 'ACTIVE' : 'LOCKED',
          startedAt: isFirst ? new Date() : null,
        },
      });
    }

    // Generate physical flags for this team
    const physicalChallenges = allChallenges.filter((c) => c.type === 'PHYSICAL');
    for (const pc of physicalChallenges) {
      const pIdx = pc.code.replace('P0', 'P');
      // Generate a 2-digit random string
      const randNum = Math.floor(10 + Math.random() * 89).toString();
      const flagCode = `${pIdx}-${team.teamCode}-${pc.physicalFragment || 'X'}-${randNum}`;

      await prisma.physicalFlag.create({
        data: {
          teamId: team.id,
          challengeId: pc.id,
          flagCode,
          fragment: pc.physicalFragment || 'X',
          isCaptured: false,
        },
      });
    }

    // Sign JWT
    const token = jwt.sign(
      {
        role: 'TEAM',
        id: team.id,
        teamCode: team.teamCode,
        teamName: team.teamName,
        email: team.email,
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Team registered successfully!',
      teamCode: team.teamCode,
      token,
      team: {
        id: team.id,
        teamCode: team.teamCode,
        teamName: team.teamName,
        captainName: team.captainName,
        email: team.email,
        score: team.score,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'Team Code and password are required.' });
      return;
    }

    const { teamCode, password } = parseResult.data;

    const team = await prisma.team.findUnique({
      where: { teamCode },
      include: { members: true },
    });

    if (!team) {
      res.status(401).json({ success: false, error: 'Invalid Team Code or Password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, team.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid Team Code or Password.' });
      return;
    }

    const token = jwt.sign(
      {
        role: 'TEAM',
        id: team.id,
        teamCode: team.teamCode,
        teamName: team.teamName,
        email: team.email,
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      team: {
        id: team.id,
        teamCode: team.teamCode,
        teamName: team.teamName,
        captainName: team.captainName,
        email: team.email,
        score: team.score,
        onlineScore: team.onlineScore,
        physicalScore: team.physicalScore,
        metaCompleted: team.metaCompleted,
        members: team.members.map((m) => m.name),
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during login.' });
  }
});

// POST /api/auth/admin-login
router.post('/admin-login', async (req: Request, res: Response) => {
  try {
    const parseResult = adminLoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'Valid email and password are required.' });
      return;
    }

    const { email, password } = parseResult.data;

    let admin = await prisma.admin.findUnique({ where: { email } });

    // Fallback: If not in DB yet, check config credentials and upsert
    if (!admin && email.toLowerCase() === config.adminEmail.toLowerCase()) {
      if (password === config.adminPassword) {
        const hash = await bcrypt.hash(password, 10);
        admin = await prisma.admin.create({
          data: {
            email: config.adminEmail,
            passwordHash: hash,
            name: 'CyberGuardian Admin',
          },
        });
      }
    }

    if (!admin) {
      res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
      return;
    }

    const token = jwt.sign(
      {
        role: 'ADMIN',
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (err: any) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during admin login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role === 'ADMIN') {
      res.json({ success: true, role: 'ADMIN', user: req.user });
      return;
    }

    const team = await prisma.team.findUnique({
      where: { id: req.user?.id },
      include: { members: true },
    });

    if (!team) {
      res.status(404).json({ success: false, error: 'Team not found.' });
      return;
    }

    res.json({
      success: true,
      role: 'TEAM',
      team: {
        id: team.id,
        teamCode: team.teamCode,
        teamName: team.teamName,
        captainName: team.captainName,
        email: team.email,
        score: team.score,
        onlineScore: team.onlineScore,
        physicalScore: team.physicalScore,
        metaCompleted: team.metaCompleted,
        members: team.members.map((m) => m.name),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve profile.' });
  }
});

export default router;
