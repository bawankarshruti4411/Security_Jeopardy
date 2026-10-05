import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { OnlineChallenge, EventInfo } from '../types';
import confetti from 'canvas-confetti';
import {
  Terminal,
  Lock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Send,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface OnlineChallengesProps {
  onNavigate: (tab: string) => void;
  event: EventInfo | null;
}

export const OnlineChallenges: React.FC<OnlineChallengesProps> = ({ onNavigate, event }) => {
  const { role, team, refreshTeam } = useAuth();
  const [challenges, setChallenges] = useState<OnlineChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<OnlineChallenge | null>(null);

  // Solving terminal state
  const [answerInput, setAnswerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Hint confirmation modal
  const [confirmingHint, setConfirmingHint] = useState<1 | 2 | null>(null);
  const [isUnlockingHint, setIsUnlockingHint] = useState(false);

  const fetchChallenges = async () => {
    try {
      const res = await api.getOnlineChallenges();
      if (res.success) {
        setChallenges(res.challenges);
        // If one is selected, update it with fresh data
        if (selectedChallenge) {
          const updated = res.challenges.find((c) => c.id === selectedChallenge.id);
          if (updated) setSelectedChallenge(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'TEAM') {
      fetchChallenges();
    } else {
      setLoading(false);
    }
  }, [role]);

  // Open modal for challenge
  const handleSelectChallenge = (c: OnlineChallenge) => {
    if (c.status === 'LOCKED') return;
    setSelectedChallenge(c);
    setAnswerInput('');
    setSubmitFeedback(null);
  };

  // Submit Answer
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallenge || !answerInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const res = await api.submitOnlineAnswer(selectedChallenge.id, answerInput.trim());

      if (res.isCorrect) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f2fe', '#8b5cf6', '#10b981'],
        });

        setSubmitFeedback({
          type: 'success',
          message: res.nextUnlocked
            ? `CORRECT! +${res.pointsEarned} points awarded. ${res.nextUnlocked} unlocked.`
            : `CORRECT! +${res.pointsEarned} points awarded.`,
        });

        await refreshTeam();
        await fetchChallenges();
      } else {
        setSubmitFeedback({
          type: 'error',
          message: res.error || 'Incorrect answer. Try again.',
        });
        await fetchChallenges();
      }
    } catch (err: any) {
      setSubmitFeedback({
        type: 'error',
        message: err.message || 'Submission error. Check network.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unlock Hint
  const handleUnlockHint = async (hintNum: 1 | 2) => {
    if (!selectedChallenge || isUnlockingHint) return;

    setIsUnlockingHint(true);
    try {
      const res = await api.unlockOnlineHint(selectedChallenge.id, hintNum);
      if (res.success) {
        setConfirmingHint(null);
        await fetchChallenges();
      }
    } catch (err: any) {
      setConfirmingHint(null);
      setSubmitFeedback({ type: 'error', message: err.message || 'Could not reveal hint.' });
    } finally {
      setIsUnlockingHint(false);
    }
  };

  if (role !== 'TEAM') {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-mono text-slate-100">TEAM AUTHENTICATION REQUIRED</h2>
          <p className="text-xs text-slate-400">
            You must log in with an authenticated Team Code to participate in Online Challenges.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => onNavigate('login')}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-mono font-bold text-xs"
          >
            Team Login
          </button>
          <button
            onClick={() => onNavigate('register')}
            className="px-5 py-2.5 rounded-xl bg-cyber-card border border-cyber-border text-slate-300 text-xs"
          >
            Register Team
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalSolved = challenges.filter((c) => c.status === 'COMPLETED').length;
  const totalPoints = challenges.reduce((sum, c) => sum + (c.pointsEarned || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Event State Banner based on FIX 6 */}
      {event && event.status === 'NOT_STARTED' && (
        <div className="p-6 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 text-center space-y-2 font-mono">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-bold uppercase tracking-wider">
            SECURITY JEOPARDY &bull; EVENT NOT STARTED
          </div>
          <h2 className="text-lg font-bold text-white">
            Please wait for the organizer to start the competition.
          </h2>
          <p className="text-xs text-slate-400">
            Submissions and challenge interactions will unlock automatically when the master timer starts.
          </p>
        </div>
      )}

      {event && event.status === 'PAUSED' && (
        <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-center space-y-2 font-mono">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-xs font-bold uppercase tracking-wider">
            EVENT PAUSED
          </div>
          <h2 className="text-lg font-bold text-white">
            Please wait for the organizer to resume the competition.
          </h2>
          <p className="text-xs text-slate-400">Submissions are temporarily paused.</p>
        </div>
      )}

      {event && event.status === 'ENDED' && (
        <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-center space-y-2 font-mono">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800 text-xs font-bold uppercase tracking-wider">
            EVENT COMPLETED
          </div>
          <h2 className="text-lg font-bold text-white">Submissions are now closed.</h2>
          <p className="text-xs text-slate-400">
            The competition has concluded. Check the Leaderboard for final standings.
          </p>
        </div>
      )}

      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-cyber-surface/90 border border-cyber-border backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
            <Terminal className="w-4 h-4" />
            ONLINE CYBER CHALLENGE MATRIX
          </div>
          <h1 className="text-2xl font-black font-mono text-slate-100 tracking-tight">
            10 CYBERSECURITY RIDDLES
          </h1>
          <p className="text-xs text-slate-400">
            Sequential progression. Solve a challenge (or use up its 3 attempts) to unlock the next one.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyber-card border border-cyber-border text-center font-mono">
            <div className="text-[10px] text-slate-400">SOLVED</div>
            <div className="text-lg font-bold text-cyan-400">
              {totalSolved} <span className="text-xs text-slate-500">/ 10</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyber-card border border-cyber-border text-center font-mono">
            <div className="text-[10px] text-slate-400">ONLINE PTS</div>
            <div className="text-lg font-bold text-emerald-400">{totalPoints} pts</div>
          </div>

          <button
            onClick={fetchChallenges}
            title="Refresh Challenges"
            className="p-3 rounded-xl bg-cyber-card hover:bg-cyber-surface border border-cyber-border text-slate-400 hover:text-cyan-400 transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Jeopardy Grid (10 challenges) */}
      {loading ? (
        <div className="py-20 text-center text-xs font-mono text-cyan-400 animate-pulse">
          LOADING CYBER RIDDLE REPOSITORY...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {challenges.map((c, index) => {
            const isLocked = c.status === 'LOCKED';
            const isCompleted = c.status === 'COMPLETED';
            const isFailed = c.status === 'FAILED';
            const isActive = c.status === 'ACTIVE';

            return (
              <div
                key={c.id}
                onClick={() => handleSelectChallenge(c)}
                className={`p-5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between select-none ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 cursor-pointer shadow-glow-green/20'
                    : isFailed
                    ? 'bg-rose-950/20 border-rose-500/40 opacity-70 cursor-pointer'
                    : isActive
                    ? 'bg-cyber-card border-cyan-500/60 hover:border-cyan-400 cursor-pointer shadow-glow-cyan/20 animate-pulse'
                    : 'bg-cyber-surface/40 border-cyber-border/40 opacity-50 cursor-not-allowed'
                }`}
              >
                <div>
                  {/* Top Bar: Code & Points */}
                  <div className="flex items-center justify-between text-xs font-mono mb-3">
                    <span
                      className={`font-bold ${
                        isCompleted
                          ? 'text-emerald-400'
                          : isActive
                          ? 'text-cyan-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {c.code}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyber-bg border border-cyber-border text-slate-300">
                      {isCompleted ? `${c.pointsEarned} PTS` : `${c.points} PTS`}
                    </span>
                  </div>

                  {/* Challenge Title */}
                  <h3 className="font-mono font-bold text-sm text-slate-100 tracking-wide line-clamp-2 min-h-[2.5rem]">
                    {c.title}
                  </h3>

                  <div className="mt-2 text-[11px] font-mono text-slate-400">
                    Difficulty: <span className="text-slate-200">{c.difficulty}</span>
                  </div>
                </div>

                {/* Status Indicator Bottom based on FIX 7 */}
                <div className="mt-5 pt-3 border-t border-cyber-border/60 text-xs font-mono">
                  {isCompleted ? (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        ✓ SOLVED
                      </span>
                      <span className="text-[10px] text-emerald-300 font-bold">
                        +{c.pointsEarned} pts
                      </span>
                    </div>
                  ) : isFailed ? (
                    <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                      <XCircle className="w-4 h-4" />
                      FAILED
                    </span>
                  ) : isActive ? (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                        &gt; SOLVE NOW
                      </span>
                      {c.attempts > 0 && (
                        <span className="text-[10px] text-amber-400 font-bold">
                          {3 - c.attempts} try left
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                        <Lock className="w-3.5 h-3.5" />
                        LOCKED
                      </span>
                      <div className="text-[10px] text-slate-500">
                        Finish Challenge {index > 0 ? challenges[index - 1].code : 'previous'} first.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Challenge Solve Modal / Drawer */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-2xl w-full p-6 sm:p-8 rounded-2xl bg-cyber-surface border border-cyan-500/40 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-cyber-border pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
                  <span>{selectedChallenge.code}</span>
                  <span>&middot;</span>
                  <span>{selectedChallenge.difficulty}</span>
                  <span>&middot;</span>
                  <span className="text-emerald-400 font-bold">{selectedChallenge.points} Base PTS</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-mono text-white">
                  {selectedChallenge.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedChallenge(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-cyber-card transition"
              >
                ✕
              </button>
            </div>

            {/* Riddle Text Box */}
            <div className="p-5 rounded-xl bg-cyber-card/80 border border-cyber-border font-mono text-sm leading-relaxed text-slate-200">
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                CYBER RIDDLE SPECIFICATION:
              </div>
              <p className="whitespace-pre-line text-slate-100 font-medium">
                "{selectedChallenge.description}"
              </p>
            </div>

            {/* Hint System */}
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                TACTICAL INTELLIGENCE / HINTS
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Hint 1 */}
                <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-200">Hint 1</span>
                    <span className="text-amber-400">-{selectedChallenge.hint1Penalty} pts</span>
                  </div>

                  {selectedChallenge.hint1Used && selectedChallenge.hint1 ? (
                    <p className="text-xs text-amber-200/90 font-mono bg-amber-950/20 p-2 rounded-lg border border-amber-500/30">
                      {selectedChallenge.hint1}
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={selectedChallenge.status === 'COMPLETED' || selectedChallenge.status === 'FAILED'}
                      onClick={() => setConfirmingHint(1)}
                      className="w-full py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs font-semibold transition disabled:opacity-40"
                    >
                      Reveal Hint 1 (-{selectedChallenge.hint1Penalty} pts)
                    </button>
                  )}
                </div>

                {/* Hint 2 */}
                <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-200">Hint 2</span>
                    <span className="text-rose-400">-{selectedChallenge.hint2Penalty} pts</span>
                  </div>

                  {selectedChallenge.hint2Used && selectedChallenge.hint2 ? (
                    <p className="text-xs text-rose-200/90 font-mono bg-rose-950/20 p-2 rounded-lg border border-rose-500/30">
                      {selectedChallenge.hint2}
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        !selectedChallenge.hint1Used ||
                        selectedChallenge.status === 'COMPLETED' ||
                        selectedChallenge.status === 'FAILED'
                      }
                      onClick={() => setConfirmingHint(2)}
                      className="w-full py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-xs font-semibold transition disabled:opacity-40"
                    >
                      {selectedChallenge.hint1Used
                        ? `Reveal Hint 2 (-${selectedChallenge.hint2Penalty} pts)`
                        : 'Unlock Hint 1 First'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Answer Input or Result Display */}
            {selectedChallenge.status === 'COMPLETED' ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 font-mono text-xs">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <strong>CHALLENGE SOLVED!</strong> You earned{' '}
                  <span className="font-bold">{selectedChallenge.pointsEarned} points</span> on this
                  riddle.
                </div>
              </div>
            ) : selectedChallenge.status === 'FAILED' ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 font-mono text-xs">
                <XCircle className="w-5 h-5" />
                <div>
                  <strong>ATTEMPTS EXHAUSTED:</strong> Maximum 3 attempts reached. This challenge
                  is locked, but you can continue with the next one.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitAnswer} className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>Enter Riddle Answer:</span>
                  <span className="text-amber-400 font-semibold">
                    Attempts remaining: {Math.max(0, 3 - selectedChallenge.attempts)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="[ ENTER YOUR ANSWER ]"
                    disabled={isSubmitting || event?.status !== 'RUNNING'}
                    className="flex-1 px-4 py-3 rounded-xl bg-cyber-bg border border-cyber-border focus:border-cyan-400 focus:outline-none text-slate-100 font-mono text-sm uppercase placeholder:normal-case"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !answerInput.trim() || event?.status !== 'RUNNING'}
                    className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs tracking-wider shadow-glow-cyan flex items-center gap-2 transition disabled:opacity-40"
                  >
                    <span>{isSubmitting ? 'VERIFYING...' : '[ SUBMIT ]'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* Submission Feedback Alert */}
            {submitFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-mono flex items-center gap-2.5 ${
                  submitFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                {submitFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{submitFeedback.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hint Confirmation Dialog */}
      {confirmingHint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-sm w-full p-6 rounded-2xl bg-cyber-surface border border-amber-500/40 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lightbulb className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-mono font-bold text-white text-base">
                CONFIRM HINT {confirmingHint} REVEAL?
              </h3>
              <p className="text-xs text-slate-300">
                Revealing Hint {confirmingHint} will deduct{' '}
                <span className="text-amber-400 font-bold">
                  {confirmingHint === 1
                    ? selectedChallenge?.hint1Penalty
                    : selectedChallenge?.hint2Penalty}{' '}
                  points
                </span>{' '}
                from this challenge.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmingHint(null)}
                className="flex-1 py-2.5 rounded-xl bg-cyber-card border border-cyber-border text-xs text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUnlockHint(confirmingHint)}
                disabled={isUnlockingHint}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs"
              >
                {isUnlockingHint ? 'Unlocking...' : 'Yes, Deduct Points'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
