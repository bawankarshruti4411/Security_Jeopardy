import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { LeaderboardEntry } from '../types';
import { Trophy, Medal, Shield, RefreshCw, EyeOff, Sparkles, Clock, Compass } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchLeaderboard = async () => {
    try {
      const res = await api.getLeaderboard();
      if (res.success) {
        setIsVisible(res.isVisible);
        setLeaderboard(res.leaderboard || []);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // Auto refresh every 5 seconds
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatLastSolve = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-cyber-surface/90 border border-cyber-border backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs text-purple-400">
            <Trophy className="w-4 h-4" />
            LIVE BATTLE ARENA RANKINGS
          </div>
          <h1 className="text-2xl font-black font-mono text-slate-100 tracking-tight">
            LEADERBOARD STANDINGS
          </h1>
          <p className="text-xs text-slate-400">
            Real-time score calculation across online challenges, physical flag hunts, and meta
            decoding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono text-[11px] text-slate-400">
            <div>Auto-refreshing every 5s</div>
            <div className="text-slate-500">Updated: {lastRefreshed.toLocaleTimeString()}</div>
          </div>
          <button
            onClick={fetchLeaderboard}
            title="Refresh Leaderboard"
            className="p-3 rounded-xl bg-cyber-card hover:bg-cyber-surface border border-cyber-border text-slate-400 hover:text-cyan-400 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Classified / Hidden Mode Notice */}
      {!isVisible ? (
        <div className="p-12 rounded-2xl bg-cyber-surface/80 border border-amber-500/40 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <EyeOff className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-mono text-slate-100">
              LEADERBOARD FROZEN &middot; CLASSIFIED
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              The live scoreboard has been temporarily classified by tournament administrators for
              the final suspense and result verification. Winners will be announced during the
              closing ceremony.
            </p>
          </div>
        </div>
      ) : loading ? (
        <div className="py-20 text-center text-xs font-mono text-cyan-400 animate-pulse">
          AGGREGATING REAL-TIME COMPETITOR DATA...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* #2 Rank */}
              <div className="p-6 rounded-2xl bg-cyber-card/90 border border-slate-600/60 flex flex-col justify-between text-center relative order-2 md:order-1">
                <div className="space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-700/50 border border-slate-500 flex items-center justify-center text-slate-300 font-mono font-bold text-sm">
                    #2
                  </div>
                  <h3 className="font-mono font-bold text-base text-slate-100">
                    {leaderboard[1].teamName}
                  </h3>
                  <div className="text-xs font-mono text-slate-400">
                    {leaderboard[1].teamCode} &bull; Capt: {leaderboard[1].captainName}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-cyber-border font-mono">
                  <div className="text-2xl font-black text-slate-200">
                    {leaderboard[1].score}{' '}
                    <span className="text-xs text-slate-400 font-normal">PTS</span>
                  </div>
                  <div className="text-[11px] text-cyan-400 mt-1">
                    {leaderboard[1].completedChallenges} Solves &bull;{' '}
                    {leaderboard[1].physicalFlagsCaptured} Flags
                  </div>
                </div>
              </div>

              {/* #1 Rank (Center, Highlighted) */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-950/40 via-cyber-surface to-cyber-card border-2 border-amber-400/80 shadow-glow-cyan flex flex-col justify-between text-center relative order-1 md:order-2 transform md:-translate-y-2">
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 font-mono font-black text-base shadow-glow-cyan">
                    <Trophy className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    CURRENT LEADER
                  </div>
                  <h3 className="font-mono font-black text-lg text-white">
                    {leaderboard[0].teamName}
                  </h3>
                  <div className="text-xs font-mono text-cyan-300">
                    {leaderboard[0].teamCode} &bull; Capt: {leaderboard[0].captainName}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-cyber-border font-mono">
                  <div className="text-3xl font-black text-amber-400">
                    {leaderboard[0].score}{' '}
                    <span className="text-xs text-amber-200 font-normal">PTS</span>
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold mt-1">
                    {leaderboard[0].completedChallenges} Solves &bull;{' '}
                    {leaderboard[0].physicalFlagsCaptured} Flags Captured
                  </div>
                </div>
              </div>

              {/* #3 Rank */}
              <div className="p-6 rounded-2xl bg-cyber-card/90 border border-amber-800/60 flex flex-col justify-between text-center relative order-3">
                <div className="space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-amber-900/30 border border-amber-700 flex items-center justify-center text-amber-500 font-mono font-bold text-sm">
                    #3
                  </div>
                  <h3 className="font-mono font-bold text-base text-slate-100">
                    {leaderboard[2].teamName}
                  </h3>
                  <div className="text-xs font-mono text-slate-400">
                    {leaderboard[2].teamCode} &bull; Capt: {leaderboard[2].captainName}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-cyber-border font-mono">
                  <div className="text-2xl font-black text-slate-200">
                    {leaderboard[2].score}{' '}
                    <span className="text-xs text-slate-400 font-normal">PTS</span>
                  </div>
                  <div className="text-[11px] text-cyan-400 mt-1">
                    {leaderboard[2].completedChallenges} Solves &bull;{' '}
                    {leaderboard[2].physicalFlagsCaptured} Flags
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Table View */}
          <div className="p-6 rounded-2xl bg-cyber-surface border border-cyber-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-cyber-border text-slate-400 font-mono text-xs">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Team Code</th>
                    <th className="py-3 px-4">Squad Name</th>
                    <th className="py-3 px-4">Captain</th>
                    <th className="py-3 px-4 text-center">Online Pts</th>
                    <th className="py-3 px-4 text-center">Physical Pts</th>
                    <th className="py-3 px-4 text-center">Flags</th>
                    <th className="py-3 px-4 text-right">Total Score</th>
                    <th className="py-3 px-4 text-right">Last Solve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/60 text-xs font-mono">
                  {leaderboard.map((team) => {
                    const isTop3 = team.rank <= 3;
                    return (
                      <tr
                        key={team.teamCode}
                        className={`hover:bg-cyber-card/60 transition ${
                          team.rank === 1
                            ? 'bg-amber-950/10'
                            : team.rank === 2
                            ? 'bg-slate-800/10'
                            : team.rank === 3
                            ? 'bg-amber-900/10'
                            : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold ${
                              team.rank === 1
                                ? 'bg-amber-400 text-black'
                                : team.rank === 2
                                ? 'bg-slate-300 text-black'
                                : team.rank === 3
                                ? 'bg-amber-700 text-white'
                                : 'text-slate-400'
                            }`}
                          >
                            {team.rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-cyan-400">{team.teamCode}</td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{team.teamName}</span>
                            {team.metaCompleted && (
                              <span
                                title="Final Meta Solved"
                                className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              >
                                META
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{team.captainName}</td>
                        <td className="py-3.5 px-4 text-center text-cyan-300">
                          {team.onlineScore}
                        </td>
                        <td className="py-3.5 px-4 text-center text-purple-300">
                          {team.physicalScore}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-300">
                          {team.physicalFlagsCaptured} / 5
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-sm text-slate-100">
                          {team.score}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400">
                          {formatLastSolve(team.lastSolveAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
