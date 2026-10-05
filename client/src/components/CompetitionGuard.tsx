import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ShieldAlert, Lock, Maximize } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { EventInfo } from '../types';

type ViolationType = 'TAB_HIDDEN' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT';

interface CompetitionGuardProps {
  event: EventInfo | null;
  children: React.ReactNode;
}

// One tab switch fires several events (blur, visibilitychange, fullscreenchange);
// report it once.
const CLIENT_DEBOUNCE_MS = 3000;
// Ignore momentary focus loss (e.g. browser UI); only count if focus stays away.
const BLUR_GRACE_MS = 1500;

/**
 * While the event is RUNNING, a logged-in team must stay in fullscreen and on this
 * tab. Every tab/app switch or fullscreen exit is reported to the server; after
 * the 3rd the server locks the team until an organizer unlocks it.
 */
export const CompetitionGuard: React.FC<CompetitionGuardProps> = ({ event, children }) => {
  const { role } = useAuth();
  const active = role === 'TEAM' && event?.status === 'RUNNING';
  const fullscreenSupported = typeof document !== 'undefined' && !!document.fullscreenEnabled;

  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);
  const [violationCount, setViolationCount] = useState(0);
  const [maxViolations, setMaxViolations] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [warning, setWarning] = useState<number | null>(null);

  const lastReportRef = useRef(0);
  const enteredFullscreenRef = useRef(false);
  const activeRef = useRef(active);
  const lockedRef = useRef(isLocked);
  activeRef.current = active;
  lockedRef.current = isLocked;

  const refreshStatus = useCallback(async () => {
    try {
      const res = await api.getIntegrityStatus();
      setViolationCount(res.violationCount);
      setMaxViolations(res.maxViolations);
      setIsLocked(res.isLocked);
    } catch {
      // network hiccup: keep current state
    }
  }, []);

  const report = useCallback(async (type: ViolationType) => {
    if (!activeRef.current || lockedRef.current) return;
    const now = Date.now();
    if (now - lastReportRef.current < CLIENT_DEBOUNCE_MS) return;
    lastReportRef.current = now;

    try {
      const res = await api.reportViolation(type);
      setViolationCount(res.violationCount);
      setMaxViolations(res.maxViolations);
      setIsLocked(res.isLocked);
      if (res.counted && !res.isLocked) setWarning(res.violationCount);
    } catch {
      // If the report fails we still warn locally
      setWarning((w) => w ?? 0);
    }
  }, []);

  // Load current status when the guard becomes active
  useEffect(() => {
    if (active) refreshStatus();
  }, [active, refreshStatus]);

  // While locked, poll so the screen clears as soon as an organizer unlocks the team
  useEffect(() => {
    if (!active || !isLocked) return;
    const interval = setInterval(refreshStatus, 10000);
    return () => clearInterval(interval);
  }, [active, isLocked, refreshStatus]);

  // Leave fullscreen automatically when the event stops running
  useEffect(() => {
    if (!active && document.fullscreenElement) {
      enteredFullscreenRef.current = false;
      document.exitFullscreen().catch(() => {});
    }
    if (!active) setWarning(null);
  }, [active]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') report('TAB_HIDDEN');
    };

    let blurTimer: ReturnType<typeof setTimeout> | undefined;
    const onBlur = () => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (document.visibilityState === 'visible' && !document.hasFocus()) report('WINDOW_BLUR');
      }, BLUR_GRACE_MS);
    };

    const onFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (fs) {
        enteredFullscreenRef.current = true;
      } else if (enteredFullscreenRef.current) {
        enteredFullscreenRef.current = false;
        report('FULLSCREEN_EXIT');
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      clearTimeout(blurTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [report]);

  const enterCompetitionMode = async () => {
    setWarning(null);
    if (fullscreenSupported && !document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // Browser refused (rare); the overlay stays so the team can retry
      }
    }
  };

  let overlay: React.ReactNode = null;

  if (active && isLocked) {
    overlay = (
      <GuardOverlay tone="rose" icon={<Lock className="w-8 h-8" />} title="TEAM LOCKED">
        <p>
          Your team left the competition window {maxViolations} times. Submissions are blocked.
        </p>
        <p className="text-slate-400">
          Ask an organizer to unlock your team. This screen clears automatically once they do.
        </p>
      </GuardOverlay>
    );
  } else if (active && warning !== null) {
    overlay = (
      <GuardOverlay tone="rose" icon={<ShieldAlert className="w-8 h-8" />} title="TAB SWITCH DETECTED">
        <p>
          Leaving the competition window is not allowed.{' '}
          {warning > 0 && (
            <strong className="text-rose-300">
              Warning {warning} of {maxViolations}.
            </strong>
          )}
        </p>
        <p className="text-slate-400">
          On the {ordinal(maxViolations)} violation your team will be locked out of submitting.
        </p>
        <ReturnButton onClick={enterCompetitionMode} />
      </GuardOverlay>
    );
  } else if (active && fullscreenSupported && !isFullscreen) {
    overlay = (
      <GuardOverlay tone="cyan" icon={<Maximize className="w-8 h-8" />} title="COMPETITION MODE REQUIRED">
        <p>The event is live. Challenges are available in fullscreen competition mode only.</p>
        <p className="text-slate-400">
          Do not switch tabs, apps or windows, and do not press Esc. Violations so far:{' '}
          {violationCount} / {maxViolations}.
        </p>
        <ReturnButton onClick={enterCompetitionMode} label="ENTER COMPETITION MODE" />
      </GuardOverlay>
    );
  }

  return (
    <>
      {children}
      {overlay}
    </>
  );
};

function ordinal(n: number): string {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
}

const GuardOverlay: React.FC<{
  tone: 'rose' | 'cyan';
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ tone, icon, title, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
    <div
      className={`max-w-md w-full p-8 rounded-2xl bg-cyber-surface border-2 space-y-5 text-center font-mono ${
        tone === 'rose' ? 'border-rose-500/60' : 'border-cyan-500/60'
      }`}
    >
      <div
        className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
          tone === 'rose' ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'
        }`}
      >
        {icon}
      </div>
      <h2 className="text-xl font-black text-white tracking-wide">{title}</h2>
      <div className="space-y-2 text-xs text-slate-200 leading-relaxed">{children}</div>
    </div>
  </div>
);

const ReturnButton: React.FC<{ onClick: () => void; label?: string }> = ({
  onClick,
  label = 'RETURN TO COMPETITION',
}) => (
  <button
    onClick={onClick}
    className="w-full mt-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm tracking-wide transition"
  >
    {label}
  </button>
);
