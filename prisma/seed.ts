import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const ONLINE_CHALLENGES = [
  {
    code: 'O01',
    title: 'THE FIRST LINE OF DEFENSE',
    type: 'ONLINE',
    difficulty: 'Easy',
    points: 10,
    concept: 'FIREWALL',
    description: `I stand between your device and the outside world.
I watch traffic coming in and going out.
I allow some connections and block others.
What am I?`,
    answer: 'FIREWALL',
    acceptedAnswers: ['FIREWALL', 'FIRE WALL', 'A FIREWALL', 'FIRE-WALL'],
    hint1: 'I act as a security barrier between networks.',
    hint2: 'I filter incoming and outgoing network traffic.',
    hint1Penalty: 2,
    hint2Penalty: 3,
    order: 1,
  },
  {
    code: 'O02',
    title: 'NAME RESOLUTION',
    type: 'ONLINE',
    difficulty: 'Easy',
    points: 10,
    concept: 'DNS',
    description: `You remember names, computers prefer numbers.
I translate a website name into an IP address.
What am I?`,
    answer: 'DNS',
    acceptedAnswers: ['DNS', 'DOMAIN NAME SYSTEM', 'DOMAIN NAME SERVER', 'DOMAIN NAME SERVICE'],
    hint1: "I help your browser find a website's IP address.",
    hint2: 'I translate domain names into IP addresses.',
    hint1Penalty: 2,
    hint2Penalty: 3,
    order: 2,
  },
  {
    code: 'O03',
    title: 'THE BAIT',
    type: 'ONLINE',
    difficulty: 'Easy',
    points: 10,
    concept: 'PHISHING',
    description: `I look like a trusted email, message or website.
But my real goal is to trick you into revealing secrets.
What am I?`,
    answer: 'PHISHING',
    acceptedAnswers: ['PHISHING', 'PHISHING ATTACK', 'SPEAR PHISHING'],
    hint1: 'I use deception to steal sensitive information.',
    hint2: 'Fake emails and login pages are common examples.',
    hint1Penalty: 2,
    hint2Penalty: 3,
    order: 3,
  },
  {
    code: 'O04',
    title: 'THE SELF-SPREADER',
    type: 'ONLINE',
    difficulty: 'Medium',
    points: 10,
    concept: 'WORM',
    description: `I can reproduce myself and spread from one computer to another,
often without needing a human to copy me.
What am I?`,
    answer: 'WORM',
    acceptedAnswers: ['WORM', 'COMPUTER WORM', 'A WORM', 'NETWORK WORM'],
    hint1: 'I spread automatically across systems.',
    hint2: 'Unlike a traditional virus, I can propagate without attaching myself to another file.',
    hint1Penalty: 2,
    hint2Penalty: 3,
    order: 4,
  },
  {
    code: 'O05',
    title: 'THE REUSED SECRET',
    type: 'ONLINE',
    difficulty: 'Medium',
    points: 10,
    concept: 'CREDENTIAL STUFFING',
    description: `Attackers obtain usernames and passwords from one breach
and try the same combinations on other websites.
What attack am I?`,
    answer: 'CREDENTIAL STUFFING',
    acceptedAnswers: ['CREDENTIAL STUFFING', 'CREDENTIAL STUFFING ATTACK', 'PASSWORD STUFFING'],
    hint1: 'I reuse leaked credentials.',
    hint2: 'Password reuse makes this attack dangerous.',
    hint1Penalty: 2,
    hint2Penalty: 3,
    order: 5,
  },
  {
    code: 'O06',
    title: 'THE SECURE TUNNEL',
    type: 'ONLINE',
    difficulty: 'Medium',
    points: 10,
    concept: 'VPN',
    description: `I create a protected tunnel between you and another network.
I can help protect your traffic on an untrusted network.
What am I?`,
    answer: 'VPN',
    acceptedAnswers: ['VPN', 'VIRTUAL PRIVATE NETWORK'],
    hint1: 'I create an encrypted tunnel.',
    hint2: "My name contains the word 'Private'.",
    hint1Penalty: 2,
    hint2Penalty: 3,
    order: 6,
  },
  {
    code: 'O07',
    title: 'THE INVISIBLE MIDDLE',
    type: 'ONLINE',
    difficulty: 'Medium',
    points: 10,
    concept: 'MAN IN THE MIDDLE',
    description: `Two people believe they are communicating directly.
But secretly, I position myself between them and intercept their communication.
What attack am I?`,
    answer: 'MAN IN THE MIDDLE',
    acceptedAnswers: [
      'MITM',
      'MAN-IN-THE-MIDDLE',
      'MAN IN THE MIDDLE',
      'MAN IN THE MIDDLE ATTACK',
      'MITM ATTACK',
      'ON-PATH ATTACK',
      'ON PATH ATTACK'
    ],
    hint1: 'I secretly stand between two communicating parties.',
    hint2: 'My short form is MITM.',
    hint1Penalty: 2,
    hint2Penalty: 3,
    order: 7,
  },
  {
    code: 'O08',
    title: 'THE QUERY TRAP',
    type: 'ONLINE',
    difficulty: 'Hard',
    points: 10,
    concept: 'SQL INJECTION',
    description: `I manipulate an application's database query by inserting malicious input.
What attack am I?`,
    answer: 'SQL INJECTION',
    acceptedAnswers: ['SQL INJECTION', 'SQLI', 'SQL INJECTION ATTACK'],
    hint1: 'I target database queries.',
    hint2: 'My name contains SQL.',
    hint1Penalty: 2,
    hint2Penalty: 3,
    order: 8,
  },
  {
    code: 'O09',
    title: 'THE STOLEN SESSION',
    type: 'ONLINE',
    difficulty: 'Hard',
    points: 10,
    concept: 'SESSION HIJACKING',
    description: `I steal or take over a user's active session
so that I can act as that user.
What attack am I?`,
    answer: 'SESSION HIJACKING',
    acceptedAnswers: ['SESSION HIJACKING', 'COOKIE HIJACKING', 'SESSION HIJACK', 'SESSION SPOOFING'],
    hint1: 'I target an already authenticated session.',
    hint2: 'Session cookies can be valuable targets.',
    hint1Penalty: 2,
    hint2Penalty: 3,
    order: 9,
  },
  {
    code: 'O10',
    title: 'THE DIGITAL FINGERPRINT',
    type: 'ONLINE',
    difficulty: 'Hard',
    points: 10,
    concept: 'HASH',
    description: `I transform data into a fixed-length value.
I am designed to be one-way and are commonly used
to verify integrity and store passwords securely.
What am I?`,
    answer: 'HASH',
    acceptedAnswers: ['HASH', 'HASH FUNCTION', 'HASHING', 'CRYPTOGRAPHIC HASH', 'HASH DIGEST', 'A HASH'],
    hint1: 'I produce a fixed-length digest.',
    hint2: 'SHA-256 is an example.',
    hint1Penalty: 2,
    hint2Penalty: 3,
    order: 10,
  },
];

const PHYSICAL_CHALLENGES = [
  {
    code: 'P01',
    title: 'THE HIDDEN ENTRY',
    type: 'PHYSICAL',
    difficulty: 'Easy',
    points: 20,
    concept: 'BACKDOOR',
    description: `I am a secret passage created by attackers so they can return later,
even after the original attack is gone.
What am I?`,
    answer: 'BACKDOOR',
    acceptedAnswers: ['BACKDOOR', 'BACK DOOR', 'BACKDOORS'],
    hint1: 'Think of something hidden that allows unauthorized re-entry.',
    hint2: 'It creates a secret way back into a system.',
    hint1Penalty: 2,
    hint2Penalty: 3,
    order: 1,
    locationName: 'Fire hose / water equipment area',
    locationClue: `Every system has an entry point.
But some are hidden.

Find where the water warriors rest.

LOOK ONLY. DO NOT TOUCH THE EQUIPMENT.`,
    physicalFragment: 'C',
  },
  {
    code: 'P02',
    title: 'THE SILENT TRIGGER',
    type: 'PHYSICAL',
    difficulty: 'Medium',
    points: 20,
    concept: 'LOGIC BOMB',
    description: `I am a digital bomb with a timer.
I remain quiet until a particular date,
event, or condition wakes me up.
What am I?`,
    answer: 'LOGIC BOMB',
    acceptedAnswers: ['LOGIC BOMB', 'LOGICBOMB', 'A LOGIC BOMB'],
    hint1: 'I wait for a specific condition before activating.',
    hint2: 'Think of malware with a hidden trigger.',
    hint1Penalty: 2,
    hint2Penalty: 3,
    order: 2,
    locationName: 'Fire alarm',
    locationClue: `I stay silent until something happens.

Find the object that can make the whole building hear you.

LOOK ONLY. DO NOT TOUCH.`,
    physicalFragment: 'Y',
  },
  {
    code: 'P03',
    title: 'THE GATEKEEPER',
    type: 'PHYSICAL',
    difficulty: 'Medium',
    points: 20,
    concept: 'AUTHENTICATION',
    description: `I answer one question before access is granted:

'Are you really who you claim to be?'

What am I?`,
    answer: 'AUTHENTICATION',
    acceptedAnswers: ['AUTHENTICATION', 'AUTH', 'USER AUTHENTICATION'],
    hint1: "I answer 'Who are you?'",
    hint2: 'I verify identity before access.',
    hint1Penalty: 2,
    hint2Penalty: 3,
    order: 3,
    locationName: 'Door handle',
    locationClue: `Before a user enters a system,
identity must be checked.

Find the gatekeeper of physical entry.`,
    physicalFragment: 'B',
  },
  {
    code: 'P04',
    title: 'THE CIPHER RAIL',
    type: 'PHYSICAL',
    difficulty: 'Hard',
    points: 20,
    concept: 'ENCRYPTION',
    description: `I transform readable information into unreadable ciphertext
so unauthorized people cannot understand it.
What am I?`,
    answer: 'ENCRYPTION',
    acceptedAnswers: ['ENCRYPTION', 'CIPHER', 'CRYPTOGRAPHY'],
    hint1: 'Each number represents a letter.',
    hint2: 'A=1, B=2, C=3...',
    hint1Penalty: 2,
    hint2Penalty: 3,
    order: 4,
    locationName: 'Wooden railing',
    locationClue: `I protect an edge.
I stretch across the lobby.
Find the structure that keeps you from falling.

Physical flag contains cipher: 19 - 5 - 3 - 21 - 18 - 9 - 20 - 25
(Decode using A1Z26 -> SECURITY)`,
    physicalFragment: 'E',
  },
  {
    code: 'P05',
    title: 'THE NETWORK ENDPOINT',
    type: 'PHYSICAL',
    difficulty: 'Hard',
    points: 20,
    concept: 'PORT',
    description: `I am a number that identifies a service
waiting at a particular door of a computer.
What am I?`,
    answer: 'PORT',
    acceptedAnswers: ['PORT', 'NETWORK PORT', 'PORT NUMBER'],
    hint1: 'Think of a digital door for a service.',
    hint2: 'Examples include 80 and 443.',
    hint1Penalty: 2,
    hint2Penalty: 3,
    order: 5,
    locationName: 'Wall-mounted device / cable endpoint',
    locationClue: `Packets travel through networks.

Find the place where the cable meets the device.

Your final flag is waiting nearby.`,
    physicalFragment: 'R',
  },
];

const DEMO_TEAMS = [
  {
    teamCode: 'SJ-T001',
    teamName: 'Cyber Warriors',
    captainName: 'Aarav Sharma',
    email: 'team1@cyberguardian.club',
    members: ['Aarav Sharma', 'Pooja Patil', 'Rohan Mehta', 'Neha Gupta'],
    routeIndex: 0, // Starts at P1
    flagRandomCodes: { P01: '47', P02: '21', P03: '09', P04: '73', P05: '84' },
  },
  {
    teamCode: 'SJ-T002',
    teamName: 'Byte Busters',
    captainName: 'Ananya Deshmukh',
    email: 'team2@cyberguardian.club',
    members: ['Ananya Deshmukh', 'Karan Joshi', 'Sneha Kulkarni'],
    routeIndex: 1, // Starts at P2
    flagRandomCodes: { P01: '52', P02: '36', P03: '14', P04: '88', P05: '91' },
  },
  {
    teamCode: 'SJ-T003',
    teamName: 'Null Pointers',
    captainName: 'Vikram Rathi',
    email: 'team3@cyberguardian.club',
    members: ['Vikram Rathi', 'Tanvi Shinde', 'Aditya Verma', 'Priya Nair'],
    routeIndex: 2, // Starts at P3
    flagRandomCodes: { P01: '63', P02: '49', P03: '27', P04: '95', P05: '12' },
  },
  {
    teamCode: 'SJ-T004',
    teamName: 'Shadow Hackers',
    captainName: 'Rahul Chavan',
    email: 'team4@cyberguardian.club',
    members: ['Rahul Chavan', 'Divya Rao', 'Kunal Shinde'],
    routeIndex: 3, // Starts at P4
    flagRandomCodes: { P01: '71', P02: '58', P03: '33', P04: '19', P05: '26' },
  },
  {
    teamCode: 'SJ-T005',
    teamName: 'Binary Knights',
    captainName: 'Sameer Kale',
    email: 'team5@cyberguardian.club',
    members: ['Sameer Kale', 'Isha More', 'Varun Patil', 'Ritu Shah'],
    routeIndex: 4, // Starts at P5
    flagRandomCodes: { P01: '82', P02: '64', P03: '41', P04: '25', P05: '38' },
  },
];

export async function seedDatabase() {
  console.log('--- SEEDING SECURITY JEOPARDY DATABASE ---');

  // 1. Seed or Upsert Event (Default to NOT_STARTED for dev testing)
  const event = await prisma.event.upsert({
    where: { id: 'security-jeopardy-main-event' },
    update: {
      status: 'NOT_STARTED',
      startTime: null,
      endTime: null,
      remainingSecondsWhenPaused: null,
      durationMinutes: 60,
    },
    create: {
      id: 'security-jeopardy-main-event',
      name: 'SECURITY JEOPARDY',
      status: 'NOT_STARTED',
      durationMinutes: 60,
      isLeaderboardVisible: true,
    },
  });
  console.log(`Event created/checked: "${event.name}" [Status: ${event.status}]`);

  // 2. Seed Admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cyberguardian.club';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminJeopardy2026!';
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      name: 'Dr. Snehlata Wankhede & Prof. Firdous Sadaf (Admin)',
    },
  });
  console.log(`Admin account seeded: ${admin.email}`);

  // 3. Seed Online Challenges
  for (const c of ONLINE_CHALLENGES) {
    await prisma.challenge.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }
  console.log(`Seeded ${ONLINE_CHALLENGES.length} online challenges (O01 - O10).`);

  // 4. Seed Physical Challenges
  for (const c of PHYSICAL_CHALLENGES) {
    await prisma.challenge.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }
  console.log(`Seeded ${PHYSICAL_CHALLENGES.length} physical challenges (P01 - P05).`);

  // 5. Seed Demo Teams and their team-specific Physical Flags
  const defaultTeamPassword = await bcrypt.hash('CyberGuardian2026!', 10);
  const allChallenges = await prisma.challenge.findMany();
  const physicalMap = new Map(allChallenges.filter((c) => c.type === 'PHYSICAL').map((c) => [c.code, c]));
  const firstOnline = allChallenges.find((c) => c.code === 'O01');

  for (const t of DEMO_TEAMS) {
    const team = await prisma.team.upsert({
      where: { teamCode: t.teamCode },
      update: {
        teamName: t.teamName,
        captainName: t.captainName,
        email: t.email,
        passwordHash: defaultTeamPassword,
        routeIndex: t.routeIndex,
        score: 0,
        onlineScore: 0,
        physicalScore: 0,
        completedCount: 0,
        metaCompleted: false,
        metaCompletedAt: null,
        lastSolveAt: null,
      },
      create: {
        teamCode: t.teamCode,
        teamName: t.teamName,
        captainName: t.captainName,
        email: t.email,
        passwordHash: defaultTeamPassword,
        routeIndex: t.routeIndex,
      },
    });

    // Seed members
    await prisma.teamMember.deleteMany({ where: { teamId: team.id } });
    for (const m of t.members) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          name: m,
        },
      });
    }

    // Ensure initial O01 challenge is ACTIVE, others LOCKED
    for (const c of allChallenges) {
      const isFirst = c.code === 'O01';
      await prisma.teamChallengeProgress.upsert({
        where: {
          teamId_challengeId: {
            teamId: team.id,
            challengeId: c.id,
          },
        },
        update: {
          status: isFirst ? 'ACTIVE' : 'LOCKED',
          attempts: 0,
          pointsEarned: 0,
          hint1Used: false,
          hint2Used: false,
          completedAt: null,
          startedAt: isFirst ? new Date() : null,
        },
        create: {
          teamId: team.id,
          challengeId: c.id,
          status: isFirst ? 'ACTIVE' : 'LOCKED',
          startedAt: isFirst ? new Date() : null,
        },
      });
    }

    // Seed team-specific physical flags
    // Format: P1-[TEAM_CODE]-C-[RANDOM]
    for (const pChallenge of physicalMap.values()) {
      const pIndex = pChallenge.code.replace('P0', 'P'); // 'P1'..'P5'
      const rand = t.flagRandomCodes[pChallenge.code as keyof typeof t.flagRandomCodes] || '99';
      const flagCode = `${pIndex}-${t.teamCode}-${pChallenge.physicalFragment}-${rand}`;

      await prisma.physicalFlag.upsert({
        where: { flagCode },
        update: {
          isCaptured: false,
          capturedAt: null,
        },
        create: {
          teamId: team.id,
          challengeId: pChallenge.id,
          flagCode,
          fragment: pChallenge.physicalFragment || 'X',
          isCaptured: false,
        },
      });
    }
  }

  // Clear previous test submissions
  await prisma.submission.deleteMany();

  console.log(`Seeded ${DEMO_TEAMS.length} demo teams with team-specific physical flags!`);
  console.log('--- DATABASE SEED COMPLETED SUCCESSFULLY ---');
}

if (require.main === module) {
  seedDatabase()
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
