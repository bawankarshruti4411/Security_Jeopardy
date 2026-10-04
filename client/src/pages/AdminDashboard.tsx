import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { EventInfo } from '../types';
import {
  Settings,
  Play,
  Pause,
  RotateCcw,
  Square,
  Eye,
  EyeOff,
  Users,
  Terminal,
  Flag,
  List,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  RefreshCw,
  Search,
  Unlock,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
  event: EventInfo | null;
  onRefreshEvent: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  event,
  onRefreshEvent,
}) => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'submissions' | 'challenges' | 'flags'>('overview');

  const [overviewData, setOverviewData] = useState<any>(null);
  const [teamsData, setTeamsData] = useState<any[]>([]);
  const [submissionsData, setSubmissionsData] = useState<any[]>([]);
  const [challengesData, setChallengesData] = useState<any[]>([]);
  const [flagsData, setFlagsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Event control modal inputs
  const [durationInput, setDurationInput] = useState<number>(60);
  const [actionLoading, setActionLoading] = useState(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    if (role !== 'ADMIN') return;
    setLoading(true);
    try {
      const [ov, tm, sb, ch, fl] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminTeams(),
        api.getAdminSubmissions(),
        api.getAdminChallenges(),
        api.getAdminPhysicalFlags(),
      ]);

      if (ov.success) setOverviewData(ov.overview);
      if (tm.success) setTeamsData(tm.teams);
      if (sb.success) setSubmissionsData(sb.submissions);
      if (ch.success) setChallengesData(ch.challenges);
      if (fl.success) setFlagsData(fl.flags);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  // Event Control Handlers
  const handleStart = async () => {
    setActionLoading(true);
    try {
      await api.startEvent(durationInput);
      onRefreshEvent();
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to start event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await api.pauseEvent();
      onRefreshEvent();
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to pause event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await api.resumeEvent();
      onRefreshEvent();
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to resume event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!confirm('Are you sure you want to officially END the Security Jeopardy event?')) return;
    setActionLoading(true);
    try {
      await api.endEvent();
      onRefreshEvent();
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to end event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetTimer = async () => {
    if (!confirm(`Reset competition timer to ${durationInput} minutes?`)) return;
    setActionLoading(true);
    try {
      await api.resetTimer(durationInput);
      onRefreshEvent();
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reset timer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLeaderboard = async () => {
    setActionLoading(true);
    try {
      await api.toggleLeaderboard();
      onRefreshEvent();
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle leaderboard.');
    } finally {
      setActionLoading(false);
    }
  };

  // Team Challenge controls
  const handleResetTeamChallenge = async (challengeId: string, teamId: string) => {
    if (!confirm('Reset attempts for this challenge for this team?')) return;
    try {
      await api.resetTeamChallenge(challengeId, teamId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reset challenge.');
    }
  };

  const handleUnlockTeamChallenge = async (challengeId: string, teamId: string) => {
    try {
      await api.unlockTeamChallenge(challengeId, teamId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to unlock challenge.');
    }
  };

  const handleToggleChallenge = async (challengeId: string) => {
    try {
      await api.toggleChallengeActive(challengeId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle challenge.');
    }
  };

  if (role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
          <Settings className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-mono text-slate-100">RESTRICTED TERMINAL</h2>
          <p className="text-xs text-slate-400">
            Administrative credentials required to access the event management deck.
          </p>
        </div>
        <button
          onClick={() => onNavigate('admin-login')}
          className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-mono font-bold text-xs shadow-glow-violet"
        >
          Administrator Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-cyber-surface border border-purple-500/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs text-purple-400">
            <Settings className="w-4 h-4" />
            ADMINISTRATIVE COMMAND DECK
          </div>
          <h1 className="text-2xl font-black font-mono text-slate-100 tracking-tight">
            SECURITY JEOPARDY CONTROLLER
          </h1>
          <p className="text-xs text-slate-400">
            Faculty: Prof. Firdous Sadaf &middot; Coordinator: Shruti Bawankar
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh All Data"
            className="p-3 rounded-xl bg-cyber-card hover:bg-cyber-surface border border-cyber-border text-slate-400 hover:text-purple-400 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Arena Master Controls */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/30 via-cyber-surface to-cyan-950/30 border border-purple-500/30 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono text-purple-300 font-bold uppercase tracking-wider">
              Event State Orchestration
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-bold text-white">
                Status: <span className="text-cyan-400">{event?.status}</span>
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyber-card border border-cyber-border text-slate-300">
                Remaining: {event?.remainingSeconds ? `${Math.floor(event.remainingSeconds / 60)}m` : '0m'}
              </span>
            </div>
          </div>

          {/* Leaderboard visibility button */}
          <button
            onClick={handleToggleLeaderboard}
            disabled={actionLoading}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold border flex items-center gap-2 transition ${event?.isLeaderboardVisible
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/40 hover:bg-amber-500/20'
              }`}
          >
            {event?.isLeaderboardVisible ? (
              <>
                <Eye className="w-4 h-4" />
                <span>Leaderboard: PUBLIC</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                <span>Leaderboard: CLASSIFIED</span>
              </>
            )}
          </button>
        </div>

        {/* Master Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {event?.status !== 'RUNNING' && event?.status !== 'PAUSED' && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="240"
                value={durationInput}
                onChange={(e) => setDurationInput(parseInt(e.target.value) || 60)}
                className="w-20 px-3 py-2 rounded-xl bg-cyber-card border border-cyber-border text-xs font-mono text-cyan-400 text-center"
              />
              <span className="text-xs font-mono text-slate-400">mins</span>
              <button
                onClick={handleStart}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs shadow-glow-green flex items-center gap-1.5 transition"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>START COMPETITION</span>
              </button>
            </div>
          )}

          {event?.status === 'RUNNING' && (
            <button
              onClick={handlePause}
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Pause className="w-3.5 h-3.5 fill-black" />
              <span>PAUSE ARENA</span>
            </button>
          )}

          {event?.status === 'PAUSED' && (
            <button
              onClick={handleResume}
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>RESUME ARENA</span>
            </button>
          )}

          {event?.status !== 'NOT_STARTED' && (
            <button
              onClick={handleEnd}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Square className="w-3.5 h-3.5" />
              <span>END EVENT</span>
            </button>
          )}

          <button
            onClick={handleResetTimer}
            disabled={actionLoading}
            className="px-4 py-2 rounded-xl bg-cyber-card hover:bg-cyber-surface text-slate-300 border border-cyber-border font-mono text-xs flex items-center gap-1.5 transition ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Clock ({durationInput}m)</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {overviewData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-cyber-surface border border-cyber-border">
            <div className="text-[11px] font-mono text-slate-400">TOTAL SQUADS</div>
            <div className="text-2xl font-bold font-mono text-cyan-400">
              {overviewData.totalTeams}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-cyber-surface border border-cyber-border">
            <div className="text-[11px] font-mono text-slate-400">SOLVES RECORDED</div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {overviewData.totalSolves}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-cyber-surface border border-cyber-border">
            <div className="text-[11px] font-mono text-slate-400">FLAGS CAPTURED</div>
            <div className="text-2xl font-bold font-mono text-purple-400">
              {overviewData.physicalFlagsCaptured}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-cyber-surface border border-cyber-border">
            <div className="text-[11px] font-mono text-slate-400">TOTAL SUBMISSIONS</div>
            <div className="text-2xl font-bold font-mono text-slate-200">
              {overviewData.totalSubmissions}
            </div>
          </div>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex border-b border-cyber-border gap-2 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: List },
          { id: 'teams', label: `Teams (${teamsData.length})`, icon: Users },
          { id: 'submissions', label: `Live Submissions (${submissionsData.length})`, icon: Terminal },
          { id: 'challenges', label: `Challenges (${challengesData.length})`, icon: Shield },
          { id: 'flags', label: `Physical Flag Directory (${flagsData.length})`, icon: Flag },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition ${isActive
                  ? 'bg-cyber-surface text-purple-300 border-t border-x border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-cyber-card/50'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="p-6 rounded-2xl bg-cyber-surface border border-cyber-border space-y-6">
          <h3 className="font-mono font-bold text-sm text-slate-200 uppercase tracking-wider">
            Tournament Live Synopsis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-3 font-mono text-xs">
              <div className="font-bold text-cyan-400">Competition Specifications:</div>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                <li>Event: SECURITY JEOPARDY 2026</li>
                <li>Host: CyberGuardian Club</li>
                <li>Faculty Coordinator: Prof. Firdous Sadaf</li>
                <li>Club Coordinator: Shruti Bawankar</li>
                <li>Structure: 10 Online Riddles + 5 Physical Flag Hunts</li>
                <li>Scoring: 10 pts online, 20 pts physical (hint penalties apply)</li>
                <li>Meta Completion Passphrase: CYBER</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-3 font-mono text-xs">
              <div className="font-bold text-purple-400">Recent Activity Pulse:</div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {submissionsData.slice(0, 6).map((sub) => (
                  <div
                    key={sub.id}
                    className="p-2 rounded-lg bg-cyber-bg border border-cyber-border/70 flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="text-cyan-400 font-bold">{sub.team.teamCode}</span>{' '}
                      <span className="text-slate-400">&bull; {sub.challenge?.code || sub.submissionType}</span>
                    </div>
                    {sub.isCorrect ? (
                      <span className="text-emerald-400 font-bold">SOLVED</span>
                    ) : (
                      <span className="text-rose-400">FAILED</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Teams Management */}
      {activeTab === 'teams' && (
        <div className="p-6 rounded-2xl bg-cyber-surface border border-cyber-border space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-mono font-bold text-sm text-slate-200 uppercase tracking-wider">
              Enrolled Squads Directory
            </h3>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search squads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border text-xs text-slate-200 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-cyber-border text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3">Team Code</th>
                  <th className="py-2.5 px-3">Team Name</th>
                  <th className="py-2.5 px-3">Captain</th>
                  <th className="py-2.5 px-3">Route Index</th>
                  <th className="py-2.5 px-3">Online Pts</th>
                  <th className="py-2.5 px-3">Physical Pts</th>
                  <th className="py-2.5 px-3">Total Score</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/60">
                {teamsData
                  .filter(
                    (t) =>
                      t.teamCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      t.teamName.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-cyber-card/50">
                      <td className="py-3 px-3 font-bold text-cyan-400">{t.teamCode}</td>
                      <td className="py-3 px-3 font-bold text-white">{t.teamName}</td>
                      <td className="py-3 px-3 text-slate-300">{t.captainName}</td>
                      <td className="py-3 px-3 text-purple-300">Route #{t.routeIndex + 1}</td>
                      <td className="py-3 px-3 text-cyan-300">{t.onlineScore}</td>
                      <td className="py-3 px-3 text-purple-300">{t.physicalScore}</td>
                      <td className="py-3 px-3 font-black text-slate-100">{t.score}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-[11px] text-slate-400">
                          {t.completedCount} solved
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Live Submissions Feed */}
      {activeTab === 'submissions' && (
        <div className="p-6 rounded-2xl bg-cyber-surface border border-cyber-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono font-bold text-sm text-slate-200 uppercase tracking-wider">
              Live Real-Time Submissions Log
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Showing latest {submissionsData.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-cyber-border text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-3">Challenge / Type</th>
                  <th className="py-2.5 px-3">Submitted Answer</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Details / Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/60">
                {submissionsData.map((sub) => (
                  <tr
                    key={sub.id}
                    className={`hover:bg-cyber-card/40 ${sub.feedback?.includes('Cross-team') ? 'bg-rose-950/20' : ''
                      }`}
                  >
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(sub.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-cyan-400">
                      {sub.team.teamCode}
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      {sub.challenge?.code || sub.submissionType}
                    </td>
                    <td className="py-3 px-3 text-slate-100 max-w-xs truncate">
                      {sub.submittedAnswer}
                    </td>
                    <td className="py-3 px-3">
                      {sub.isCorrect ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          CORRECT
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          INCORRECT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {sub.feedback ? (
                        <span className={sub.feedback.includes('Cross-team') ? 'text-rose-400 font-bold' : ''}>
                          {sub.feedback}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Challenges Registry */}
      {activeTab === 'challenges' && (
        <div className="p-6 rounded-2xl bg-cyber-surface border border-cyber-border space-y-4">
          <h3 className="font-mono font-bold text-sm text-slate-200 uppercase tracking-wider">
            All 15 Competition Challenges & Solution Keys
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-cyber-border text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Difficulty</th>
                  <th className="py-2.5 px-3">Points</th>
                  <th className="py-2.5 px-3">Primary Answer</th>
                  <th className="py-2.5 px-3">Target Location</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/60">
                {challengesData.map((c) => (
                  <tr key={c.id} className="hover:bg-cyber-card/50">
                    <td className="py-3 px-3 font-bold text-cyan-400">{c.code}</td>
                    <td className="py-3 px-3 font-bold text-white">{c.title}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${c.type === 'ONLINE'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          }`}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{c.difficulty}</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">{c.points} pts</td>
                    <td className="py-3 px-3 font-bold text-amber-300">{c.answer}</td>
                    <td className="py-3 px-3 text-slate-400">{c.locationName || 'Digital Online'}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleToggleChallenge(c.id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${c.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                          }`}
                      >
                        {c.isActive ? 'ACTIVE' : 'DISABLED'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Physical Flags Directory */}
      {activeTab === 'flags' && (
        <div className="p-6 rounded-2xl bg-cyber-surface border border-cyber-border space-y-4">
          <div className="space-y-1">
            <h3 className="font-mono font-bold text-sm text-slate-200 uppercase tracking-wider">
              Physical Flags Master Vault (Marshals & Organizers Reference)
            </h3>
            <p className="text-xs text-slate-400">
              Reference list of all generated team physical flag codes, fragments, and target campus
              zones.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-cyber-border text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3">Team Code</th>
                  <th className="py-2.5 px-3">Team Name</th>
                  <th className="py-2.5 px-3">Challenge</th>
                  <th className="py-2.5 px-3">Generated Flag Code</th>
                  <th className="py-2.5 px-3">Fragment</th>
                  <th className="py-2.5 px-3">Campus Placement Area</th>
                  <th className="py-2.5 px-3 text-right">Captured?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/60">
                {flagsData.map((f) => (
                  <tr key={f.id} className="hover:bg-cyber-card/50">
                    <td className="py-3 px-3 font-bold text-cyan-400">{f.team.teamCode}</td>
                    <td className="py-3 px-3 text-white">{f.team.teamName}</td>
                    <td className="py-3 px-3 text-purple-300 font-bold">{f.challenge.code}</td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-300">{f.flagCode}</td>
                    <td className="py-3 px-3 font-black text-cyan-300">[{f.fragment}]</td>
                    <td className="py-3 px-3 text-slate-300">{f.challenge.locationName}</td>
                    <td className="py-3 px-3 text-right">
                      {f.isCaptured ? (
                        <span className="text-emerald-400 font-bold">YES</span>
                      ) : (
                        <span className="text-slate-500">NO</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
