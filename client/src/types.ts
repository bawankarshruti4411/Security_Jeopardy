export type EventStatus = 'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'ENDED';

export interface EventInfo {
  id: string;
  name: string;
  status: EventStatus;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number;
  remainingSeconds: number;
  serverTime: string;
  isLeaderboardVisible: boolean;
  canSubmit: boolean;
}

export interface TeamProfile {
  id: string;
  teamCode: string;
  teamName: string;
  captainName: string;
  email: string;
  score: number;
  onlineScore: number;
  physicalScore: number;
  metaCompleted: boolean;
  members: string[];
}

export interface OnlineChallenge {
  id: string;
  code: string;
  title: string;
  type: string;
  difficulty: string;
  description: string | null;
  points: number;
  order: number;
  status: 'LOCKED' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  attempts: number;
  maxAttempts: number;
  attemptsRemaining: number;
  hint1Penalty: number;
  hint2Penalty: number;
  hint1: string | null;
  hint2: string | null;
  hint1Used: boolean;
  hint2Used: boolean;
  pointsEarned: number;
}

export interface PhysicalChallengeStep {
  id: string;
  code: string;
  title: string;
  difficulty: string;
  points: number;
  stepIndex: number;
  status: 'LOCKED' | 'ACTIVE' | 'RIDDLE_SOLVED' | 'COMPLETED' | 'FAILED';
  isRiddleSolved: boolean;
  isCaptured: boolean;
  fragment: string | null;
  description: string | null;
  locationClue: string | null;
  locationName: string | null;
  attempts: number;
  maxAttempts: number;
  attemptsRemaining?: number;
  hint1Used: boolean;
  hint2Used: boolean;
  hint1Penalty: number;
  hint2Penalty: number;
  hint1: string | null;
  hint2: string | null;
  pointsEarned: number;
}

export interface PhysicalHuntData {
  route: PhysicalChallengeStep[];
  capturedCount: number;
  totalPhysical: number;
  capturedFragments: string[];
  allPhysicalCompleted: boolean;
  metaCompleted: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  teamCode: string;
  teamName: string;
  captainName: string;
  score: number;
  onlineScore: number;
  physicalScore: number;
  completedChallenges: number;
  physicalFlagsCaptured: number;
  metaCompleted: boolean;
  lastSolveAt: string | null;
  members: string[];
}
