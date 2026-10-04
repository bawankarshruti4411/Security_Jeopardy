import React from 'react';
import { EventInfo } from '../types';
import { Clock, Play, Pause, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CountdownTimerProps {
  event: EventInfo | null;
  onRefresh?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ event }) => {
  const defaultSeconds = (event?.durationMinutes || 60) * 60;
  const [secondsLeft, setSecondsLeft] = React.useState<number>(
    event?.status === 'NOT_STARTED'
      ? defaultSeconds
      : event?.remainingSeconds ?? defaultSeconds
  );

  React.useEffect(() => {
    if (!event) return;
    if (event.status === 'NOT_STARTED') {
      setSecondsLeft((event.durationMinutes || 60) * 60);
      return;
    }
    setSecondsLeft(event.remainingSeconds);

    if (event.status !== 'RUNNING') return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [event?.status, event?.remainingSeconds, event?.durationMinutes]);

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  if (!event) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-surface border border-cyber-border text-xs text-slate-400 font-mono">
        <Clock className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        <span>SYNCING TIME...</span>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (event.status) {
      case 'RUNNING':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            LIVE
          </span>
        );
      case 'PAUSED':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Pause className="w-3 h-3" />
            PAUSED
          </span>
        );
      case 'ENDED':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case 'NOT_STARTED':
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Clock className="w-3 h-3" />
            NOT STARTED
          </span>
        );
    }
  };

  return (
    <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-cyber-surface/90 border border-cyber-border backdrop-blur-md shadow-inner">
      {getStatusBadge()}
      <div className="flex items-center gap-1.5 font-mono text-sm tracking-wider font-bold">
        <Clock className="w-4 h-4 text-cyan-400" />
        <span
          className={
            event.status === 'RUNNING' && secondsLeft < 300
              ? 'text-rose-400 animate-pulse'
              : 'text-slate-100'
          }
        >
          {formatTime(secondsLeft)}
        </span>
      </div>
    </div>
  );
};
