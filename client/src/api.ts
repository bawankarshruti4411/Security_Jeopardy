// Same-origin '/api' by default; set VITE_API_URL when the API is hosted elsewhere.
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('sj_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server unavailable (status ${res.status}). Please try again.`);
  }
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Public
  getEvent: () => request<{ success: boolean; event: any }>('/event'),
  getLeaderboard: () => request<{ success: boolean; isVisible: boolean; leaderboard: any[] }>('/leaderboard'),

  // Auth
  registerTeam: (payload: any) =>
    request<{ success: boolean; token: string; teamCode: string; team: any }>('/auth/register-team', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  loginTeam: (payload: { teamCode: string; password: string }) =>
    request<{ success: boolean; token: string; team: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adminLogin: (payload: { email: string; password: string }) =>
    request<{ success: boolean; token: string; admin: any }>('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => request<{ success: boolean; role: 'TEAM' | 'ADMIN'; team?: any; user?: any }>('/auth/me'),

  // Player / Game
  getOnlineChallenges: () => request<{ success: boolean; challenges: any[] }>('/challenges'),
  submitOnlineAnswer: (challengeId: string, answer: string) =>
    request<any>(`/challenges/${challengeId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    }),
  unlockOnlineHint: (challengeId: string, hintNumber: 1 | 2) =>
    request<any>(`/challenges/${challengeId}/hint`, {
      method: 'POST',
      body: JSON.stringify({ hintNumber }),
    }),

  // Physical Flag Hunt
  getPhysicalRoute: () => request<any>('/physical'),
  submitPhysicalRiddle: (challengeId: string, answer: string) =>
    request<any>(`/physical/${challengeId}/submit-riddle`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    }),
  submitPhysicalFlag: (challengeId: string, flagCode: string) =>
    request<any>(`/physical/${challengeId}/submit-flag`, {
      method: 'POST',
      body: JSON.stringify({ flagCode }),
    }),
  unlockPhysicalHint: (challengeId: string, hintNumber: 1 | 2) =>
    request<any>(`/physical/${challengeId}/hint`, {
      method: 'POST',
      body: JSON.stringify({ hintNumber }),
    }),
  submitFinalMeta: (answer: string) =>
    request<any>('/physical/submit-meta', {
      method: 'POST',
      body: JSON.stringify({ answer }),
    }),

  // Competition integrity (tab switching / fullscreen)
  getIntegrityStatus: () =>
    request<{ success: boolean; violationCount: number; isLocked: boolean; maxViolations: number }>(
      '/integrity/status'
    ),
  reportViolation: (type: 'TAB_HIDDEN' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT') =>
    request<{
      success: boolean;
      counted: boolean;
      violationCount: number;
      isLocked: boolean;
      maxViolations: number;
    }>('/integrity/violation', {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),

  // Admin
  unlockTeam: (teamId: string) => request<any>(`/admin/teams/${teamId}/unlock`, { method: 'POST' }),
  getAdminOverview: () => request<any>('/admin/overview'),
  startEvent: (durationMinutes?: number) =>
    request<any>('/admin/event/start', {
      method: 'POST',
      body: JSON.stringify({ durationMinutes }),
    }),
  pauseEvent: () => request<any>('/admin/event/pause', { method: 'POST' }),
  resumeEvent: () => request<any>('/admin/event/resume', { method: 'POST' }),
  endEvent: () => request<any>('/admin/event/end', { method: 'POST' }),
  resetTimer: (durationMinutes: number) =>
    request<any>('/admin/event/reset-timer', {
      method: 'POST',
      body: JSON.stringify({ durationMinutes }),
    }),
  toggleLeaderboard: () => request<any>('/admin/event/toggle-leaderboard', { method: 'POST' }),
  getAdminTeams: () => request<any>('/admin/teams'),
  getAdminSubmissions: () => request<any>('/admin/submissions'),
  getAdminChallenges: () => request<any>('/admin/challenges'),
  getAdminPhysicalFlags: () => request<any>('/admin/physical-flags'),
  resetTeamChallenge: (challengeId: string, teamId: string) =>
    request<any>(`/admin/challenges/${challengeId}/reset-team`, {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    }),
  unlockTeamChallenge: (challengeId: string, teamId: string) =>
    request<any>(`/admin/challenges/${challengeId}/unlock-team`, {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    }),
  toggleChallengeActive: (challengeId: string) =>
    request<any>(`/admin/challenges/${challengeId}/toggle-active`, { method: 'POST' }),
};
