import React, { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface LoginProps {
  onNavigate: (tab: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { loginAsTeam } = useAuth();
  const [teamCode, setTeamCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!teamCode.trim() || !password) {
      setError('Please provide your Team Code and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.loginTeam({
        teamCode: teamCode.trim().toUpperCase(),
        password,
      });

      if (res.success && res.token) {
        loginAsTeam(res.token, res.team);
        onNavigate('online');
      } else {
        setError('Login failed. Please check credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid Team Code or Password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (code: string) => {
    setTeamCode(code);
    setPassword('CyberGuardian2026!');
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="p-8 rounded-2xl bg-cyber-surface/90 border border-cyber-border shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-mono text-slate-100">TEAM LOGIN</h1>
          <p className="text-xs text-slate-400">
            Enter your assigned Team Code and password to access the battle arena.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300">
              Team Code (e.g. SJ-T001)
            </label>
            <input
              type="text"
              required
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              placeholder="SJ-T001"
              className="w-full px-3.5 py-2.5 rounded-xl bg-cyber-card border border-cyber-border focus:border-cyan-400 focus:outline-none text-cyan-300 font-mono tracking-wider text-sm uppercase placeholder:normal-case"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-cyber-card border border-cyber-border focus:border-cyan-400 focus:outline-none text-slate-100 text-sm font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold text-sm tracking-wide shadow-glow-cyan transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'AUTHENTICATING...' : 'ENTER ARENA'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Pre-fill helper */}
        <div className="pt-4 border-t border-cyber-border/70 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fast Evaluation Credentials:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['SJ-T001', 'SJ-T002', 'SJ-T003'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => handleQuickFill(code)}
                className="py-1.5 px-2 rounded-lg bg-cyber-card hover:bg-cyber-surface border border-cyber-border hover:border-cyan-400/50 text-[11px] font-mono text-cyan-300 transition"
              >
                {code}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 text-center">
            Default seeded password: <code className="text-slate-300">CyberGuardian2026!</code>
          </p>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Don't have a team yet?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="text-cyan-400 font-semibold hover:underline"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
