import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { PhysicalHuntData, PhysicalChallengeStep, EventInfo } from '../types';
import confetti from 'canvas-confetti';
import {
  Compass,
  MapPin,
  Key,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Send,
  Sparkles,
  ArrowRight,
  Flag,
  Lightbulb,
  Award,
  RefreshCw,
  XCircle,
} from 'lucide-react';

interface PhysicalHuntProps {
  onNavigate: (tab: string) => void;
  event: EventInfo | null;
}

export const PhysicalHunt: React.FC<PhysicalHuntProps> = ({ onNavigate, event }) => {
  const { role, team, refreshTeam } = useAuth();
  const [huntData, setHuntData] = useState<PhysicalHuntData | null>(null);
  const [loading, setLoading] = useState(true);

  // Active step selection
  const [activeStep, setActiveStep] = useState<PhysicalChallengeStep | null>(null);

  // Form states
  const [riddleAnswer, setRiddleAnswer] = useState('');
  const [flagCodeInput, setFlagCodeInput] = useState('');
  const [metaAnswer, setMetaAnswer] = useState('');

  const [isSubmittingRiddle, setIsSubmittingRiddle] = useState(false);
  const [isSubmittingFlag, setIsSubmittingFlag] = useState(false);
  const [isSubmittingMeta, setIsSubmittingMeta] = useState(false);

  const [riddleFeedback, setRiddleFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [flagFeedback, setFlagFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [metaFeedback, setMetaFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchHuntData = async () => {
    try {
      const res = await api.getPhysicalRoute();
      if (res.success) {
        setHuntData(res);
        // Find current active or first incomplete challenge
        if (!activeStep) {
          const current =
            res.route.find((s: PhysicalChallengeStep) => s.status === 'ACTIVE' || s.status === 'RIDDLE_SOLVED') ||
            res.route[0];
          setActiveStep(current);
        } else {
          const updated = res.route.find((s: PhysicalChallengeStep) => s.id === activeStep.id);
          if (updated) setActiveStep(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch physical route:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'TEAM') {
      fetchHuntData();
    } else {
      setLoading(false);
    }
  }, [role]);

  // Submit riddle answer
  const handleSubmitRiddle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStep || !riddleAnswer.trim() || isSubmittingRiddle) return;

    setIsSubmittingRiddle(true);
    setRiddleFeedback(null);

    try {
      const res = await api.submitPhysicalRiddle(activeStep.id, riddleAnswer.trim());
      if (res.isCorrect) {
        setRiddleFeedback({
          type: 'success',
          message: 'RIDDLE SOLVED! Physical campus location clue revealed below.',
        });
        await fetchHuntData();
      } else {
        setRiddleFeedback({
          type: 'error',
          message: res.error || 'Incorrect riddle answer. Verify spelling.',
        });
        await fetchHuntData();
      }
    } catch (err: any) {
      setRiddleFeedback({ type: 'error', message: err.message || 'Error submitting riddle.' });
    } finally {
      setIsSubmittingRiddle(false);
    }
  };

  // Submit physical flag code
  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStep || !flagCodeInput.trim() || isSubmittingFlag) return;

    setIsSubmittingFlag(true);
    setFlagFeedback(null);

    try {
      const res = await api.submitPhysicalFlag(activeStep.id, flagCodeInput.trim());
      if (res.isCorrect) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00f2fe', '#8b5cf6', '#10b981'],
        });

        setFlagFeedback({
          type: 'success',
          message: `FLAG VERIFIED! Captured fragment "${res.fragment}" +${res.pointsEarned} pts.`,
        });

        setFlagCodeInput('');
        await refreshTeam();
        await fetchHuntData();
      } else {
        setFlagFeedback({
          type: 'error',
          message: res.error || 'Invalid physical flag code.',
        });
      }
    } catch (err: any) {
      setFlagFeedback({
        type: 'error',
        message: err.message || 'Error submitting physical flag code.',
      });
    } finally {
      setIsSubmittingFlag(false);
    }
  };

  // Submit final meta challenge
  const handleSubmitMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaAnswer.trim() || isSubmittingMeta) return;

    setIsSubmittingMeta(true);
    setMetaFeedback(null);

    try {
      const res = await api.submitFinalMeta(metaAnswer.trim());
      if (res.isCorrect) {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5 },
        });

        setMetaFeedback({
          type: 'success',
          message: '🏆 FULL COMPETITION COMPLETE! Master Cipher Decoded.',
        });

        await refreshTeam();
        await fetchHuntData();
      } else {
        setMetaFeedback({
          type: 'error',
          message: res.error || 'Incorrect keyword.',
        });
      }
    } catch (err: any) {
      setMetaFeedback({ type: 'error', message: err.message || 'Error submitting final meta.' });
    } finally {
      setIsSubmittingMeta(false);
    }
  };

  if (role !== 'TEAM') {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
          <Compass className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-mono text-slate-100">TEAM AUTHENTICATION REQUIRED</h2>
          <p className="text-xs text-slate-400">
            You must log in with an authenticated Team Code to receive your rotating campus hunt route.
          </p>
        </div>
        <button
          onClick={() => onNavigate('login')}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-mono font-bold text-xs"
        >
          Team Login
        </button>
      </div>
    );
  }

  const expectedFragments = ['C', 'Y', 'B', 'E', 'R'];
  const capturedSet = new Set(huntData?.capturedFragments || []);

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
            Physical route navigation and flag submissions will unlock when the master timer starts.
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

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-cyber-surface/90 border border-cyber-border backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs text-purple-400">
            <Compass className="w-4 h-4" />
            CAMPUS TACTICAL RECONNAISSANCE
          </div>
          <h1 className="text-2xl font-black font-mono text-slate-100 tracking-tight">
            PHYSICAL FLAG HUNT
          </h1>
          <p className="text-xs text-slate-400">
            Solve digital riddles to uncover campus coordinates. Locate and verify your squad's
            physical flag.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyber-card border border-cyber-border text-center font-mono">
            <div className="text-[10px] text-slate-400">FLAGS CAPTURED</div>
            <div className="text-lg font-bold text-purple-400">
              {huntData?.capturedCount || 0} <span className="text-xs text-slate-500">/ 5</span>
            </div>
          </div>

          <button
            onClick={fetchHuntData}
            title="Refresh Route"
            className="p-3 rounded-xl bg-cyber-card hover:bg-cyber-surface border border-cyber-border text-slate-400 hover:text-purple-400 transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Fragment Inventory HUD */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-purple-950/30 to-blue-950/30 border border-cyber-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            CIPHER KEY FRAGMENTS INVENTORY:
          </div>
          <span className="text-xs font-mono text-cyan-300">
            {huntData?.capturedCount || 0} OF 5 COLLECTED
          </span>
        </div>

        <div className="grid grid-cols-5 gap-3 max-w-xl mx-auto">
          {expectedFragments.map((char, idx) => {
            const isCollected = capturedSet.has(char);
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border text-center transition-all ${
                  isCollected
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-glow-cyan font-black'
                    : 'bg-cyber-card/60 border-cyber-border/80 text-slate-600 font-bold'
                }`}
              >
                <div className="text-2xl font-mono">{isCollected ? char : '?'}</div>
                <div className="text-[10px] font-mono mt-1 text-slate-400">POD {idx + 1}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5-Step Rotating Route Selector */}
      <div className="space-y-3">
        <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          ASSIGNED ROTATING ROUTE (ANTI-CONGESTION ISOLATION)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {huntData?.route.map((step, idx) => {
            const isSelected = activeStep?.id === step.id;
            const isCompleted = step.status === 'COMPLETED';
            const isRiddleSolved = step.status === 'RIDDLE_SOLVED' || isCompleted;
            const isLocked = step.status === 'LOCKED';
            const isFailed = step.status === 'FAILED';

            return (
              <button
                key={step.id}
                disabled={isLocked}
                onClick={() => {
                  setActiveStep(step);
                  setRiddleFeedback(null);
                  setFlagFeedback(null);
                  setRiddleAnswer('');
                  setFlagCodeInput('');
                }}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-400 shadow-glow-violet'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400'
                    : isFailed
                    ? 'bg-rose-950/20 border-rose-500/30 opacity-70 hover:border-rose-400'
                    : isLocked
                    ? 'bg-cyber-surface/40 border-cyber-border/30 opacity-40 cursor-not-allowed'
                    : 'bg-cyber-card border-cyber-border hover:border-purple-400/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="font-bold text-purple-400">STEP {idx + 1}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isFailed ? (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  ) : isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <Flag className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>

                <div className="font-mono font-bold text-xs text-slate-200 line-clamp-1">
                  {step.title}
                </div>

                <div className="mt-2 text-[10px] font-mono text-slate-400">
                  {isCompleted ? (
                    <span className="text-emerald-400 font-semibold">
                      Fragment [{step.fragment}]
                    </span>
                  ) : isFailed ? (
                    <span className="text-rose-400 font-semibold">Failed &bull; 0 pts</span>
                  ) : isRiddleSolved ? (
                    <span className="text-amber-400">Riddle Solved &bull; Locate</span>
                  ) : isLocked ? (
                    <span>Locked</span>
                  ) : (
                    <span className="text-cyan-400">Active</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Command Deck */}
      {activeStep && (
        <div className="p-6 sm:p-8 rounded-2xl bg-cyber-surface border border-purple-500/40 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-cyber-border pb-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-purple-400">
                <span>{activeStep.code}</span>
                <span>&middot;</span>
                <span>STEP {activeStep.stepIndex} OF 5</span>
                <span>&middot;</span>
                <span className="text-emerald-400 font-bold">{activeStep.points} Base PTS</span>
              </div>
              <h2 className="text-xl font-black font-mono text-white mt-1">
                {activeStep.title}
              </h2>
            </div>

            <div className="text-xs font-mono">
              Status:{' '}
              <span className="font-bold text-cyan-400">
                {activeStep.status === 'COMPLETED'
                  ? 'CAPTURED'
                  : activeStep.status === 'RIDDLE_SOLVED'
                  ? 'HUNT IN PROGRESS'
                  : activeStep.status === 'FAILED'
                  ? 'FAILED'
                  : 'SOLVE RIDDLE'}
              </span>
            </div>
          </div>

          {/* Phase 1: The Online Riddle */}
          <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyan-400" />
                PHASE 1: ONLINE CYBER DECRYPTION RIDDLE
              </div>
              {activeStep.isRiddleSolved && (
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  SOLVED
                </span>
              )}
            </div>

            <p className="text-sm font-mono text-slate-200 whitespace-pre-line leading-relaxed">
              "{activeStep.description}"
            </p>

            {/* Riddle Submission Form (if not solved) */}
            {activeStep.status === 'FAILED' && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 font-mono text-xs">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>ATTEMPTS EXHAUSTED:</strong> This step is locked (0 pts). Continue with
                  the next step on your route.
                </span>
              </div>
            )}

            {!activeStep.isRiddleSolved && activeStep.status !== 'FAILED' && (
              <form onSubmit={handleSubmitRiddle} className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>Enter Riddle Answer:</span>
                  <span className="text-amber-400">
                    Attempts: {activeStep.attempts} / {activeStep.maxAttempts}
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={riddleAnswer}
                    onChange={(e) => setRiddleAnswer(e.target.value)}
                    placeholder="Enter decrypted answer..."
                    disabled={isSubmittingRiddle || event?.status !== 'RUNNING'}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-cyber-bg border border-cyber-border focus:border-cyan-400 focus:outline-none text-slate-100 font-mono text-sm uppercase placeholder:normal-case"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingRiddle || !riddleAnswer.trim() || event?.status !== 'RUNNING'}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs shadow-glow-cyan transition flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <span>{isSubmittingRiddle ? 'VERIFYING...' : 'DECODE'}</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </form>
            )}

            {riddleFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                  riddleFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                {riddleFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{riddleFeedback.message}</span>
              </div>
            )}
          </div>

          {/* Phase 2: Campus Location Clue (UNLOCKED ONLY WHEN RIDDLE IS SOLVED) */}
          <div
            className={`p-5 rounded-xl border space-y-4 transition-all ${
              activeStep.isRiddleSolved
                ? 'bg-purple-950/20 border-purple-500/40'
                : 'bg-cyber-surface/40 border-cyber-border/40 opacity-40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-purple-400" />
                PHASE 2: CAMPUS WAYPOINT LOCATION CLUE
              </div>
              {!activeStep.isRiddleSolved && (
                <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  LOCKED UNTIL RIDDLE SOLVED
                </span>
              )}
            </div>

            {activeStep.isRiddleSolved ? (
              <div className="space-y-3 font-mono">
                <div className="p-3.5 rounded-lg bg-cyber-bg border border-purple-500/30 text-purple-200 text-sm leading-relaxed">
                  {activeStep.locationClue}
                </div>

                <div className="text-xs text-slate-400">
                  Target Zone:{' '}
                  <span className="text-slate-200 font-bold">{activeStep.locationName}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Solve the cybersecurity riddle in Phase 1 above to decrypt the campus physical
                coordinates.
              </p>
            )}
          </div>

          {/* Phase 3: Physical Flag Submission Box */}
          <div
            className={`p-5 rounded-xl border space-y-4 transition-all ${
              activeStep.isRiddleSolved
                ? 'bg-cyber-card border-cyan-500/30'
                : 'bg-cyber-surface/40 border-cyber-border/40 opacity-40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                <Flag className="w-4 h-4 text-cyan-400" />
                PHASE 3: PHYSICAL FLAG VERIFICATION & SUBMISSION
              </div>
              {activeStep.isCaptured && (
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  FLAG CAPTURED
                </span>
              )}
            </div>

            {activeStep.isCaptured ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-3">
                <Award className="w-6 h-6 text-emerald-400" />
                <div>
                  <strong>FLAG SECURED!</strong> You captured Fragment{' '}
                  <span className="text-white font-black text-sm">[{activeStep.fragment}]</span> and
                  earned {activeStep.pointsEarned} points!
                </div>
              </div>
            ) : activeStep.isRiddleSolved ? (
              <form onSubmit={handleSubmitFlag} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">
                    Enter Physical Flag Code found at campus location:
                  </label>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Format: P{activeStep.stepIndex}-{team?.teamCode}-[FRAGMENT]-[DIGITS]
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={flagCodeInput}
                    onChange={(e) => setFlagCodeInput(e.target.value.toUpperCase())}
                    placeholder={`e.g. P${activeStep.stepIndex}-${team?.teamCode}-C-47`}
                    disabled={isSubmittingFlag || event?.status !== 'RUNNING'}
                    className="flex-1 px-4 py-3 rounded-xl bg-cyber-bg border border-cyber-border focus:border-cyan-400 focus:outline-none text-cyan-300 font-mono text-sm uppercase placeholder:normal-case"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingFlag || !flagCodeInput.trim() || event?.status !== 'RUNNING'}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold text-xs tracking-wider shadow-glow-cyan flex items-center gap-2 transition disabled:opacity-40"
                  >
                    <span>{isSubmittingFlag ? 'VERIFYING...' : 'CLAIM FLAG'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Solve the Phase 1 riddle first to unlock flag submission.
              </p>
            )}

            {flagFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-mono flex items-center gap-2.5 ${
                  flagFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                {flagFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{flagFeedback.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FINAL META CIPHER TERMINAL */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-purple-950/40 to-black border-2 border-purple-500/60 shadow-glow-violet space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-purple-400">
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
              ULTIMATE MISSION OBJECTIVE
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-mono text-white">
              FINAL META CIPHER DECODER
            </h3>
            <p className="text-xs text-slate-300">
              Assemble the 5 collected fragments (C, Y, B, E, R) into the final mission passphrase.
            </p>
          </div>

          <div className="font-mono text-xs">
            {huntData?.metaCompleted ? (
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                MISSION ACCOMPLISHED
              </span>
            ) : huntData?.allPhysicalCompleted ? (
              <span className="px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold animate-pulse">
                READY TO DECODE
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-cyber-card text-slate-500 border border-cyber-border">
                {huntData?.capturedCount || 0} / 5 FRAGMENTS
              </span>
            )}
          </div>
        </div>

        {huntData?.metaCompleted ? (
          <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-center space-y-3 font-mono">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Award className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-emerald-300">MASTER KEYWORD DECODED: "CYBER"</h4>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Outstanding performance, CyberGuardians! Your squad has officially solved all tactical
              objectives of Security Jeopardy.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitMeta} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                disabled={
                  !huntData?.allPhysicalCompleted ||
                  isSubmittingMeta ||
                  event?.status !== 'RUNNING'
                }
                value={metaAnswer}
                onChange={(e) => setMetaAnswer(e.target.value.toUpperCase())}
                placeholder={
                  huntData?.allPhysicalCompleted
                    ? 'Enter assembled 5-letter keyword...'
                    : 'Capture all 5 physical flags to unlock this terminal...'
                }
                className="flex-1 px-4 py-3 rounded-xl bg-cyber-bg border border-cyber-border focus:border-purple-400 focus:outline-none text-purple-300 font-mono text-base uppercase tracking-widest disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={
                  !huntData?.allPhysicalCompleted ||
                  !metaAnswer.trim() ||
                  isSubmittingMeta ||
                  event?.status !== 'RUNNING'
                }
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs tracking-wider shadow-glow-violet transition disabled:opacity-40"
              >
                <span>{isSubmittingMeta ? 'DECRYPTING...' : 'TRANSMIT KEY'}</span>
              </button>
            </div>

            {metaFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-mono flex items-center gap-2.5 ${
                  metaFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                {metaFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{metaFeedback.message}</span>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
