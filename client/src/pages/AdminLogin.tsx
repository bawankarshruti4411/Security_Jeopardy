import React, { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Shield, Settings, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface AdminLoginProps {
  onNavigate: (tab: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onNavigate }) => {
  const { loginAsAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setIsLoading(true);
    try {
      const res = await api.adminLogin({
        email: email.trim(),
        password,
      });

      if (res.success && res.token) {
        loginAsAdmin(res.token, res.admin);
        onNavigate('admin');
      } else {
        setError('Admin authentication failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDefaultAdmin = () => {
    setEmail('admin@cyberguardian.club');
    setPassword('AdminJeopardy2026!');
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="p-8 rounded-2xl bg-cyber-surface/90 border border-purple-500/30 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Settings className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-mono text-slate-100">COMMAND PORTAL</h1>
          <p className="text-xs text-slate-400">
            Restricted administrative terminal for event coordinators & marshals.
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
            <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cyberguardian.club"
              className="w-full px-3.5 py-2.5 rounded-xl bg-cyber-card border border-cyber-border focus:border-purple-400 focus:outline-none text-slate-100 text-sm font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              Master Key / Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-cyber-card border border-cyber-border focus:border-purple-400 focus:outline-none text-slate-100 text-sm font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-sm tracking-wide shadow-glow-violet transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'VERIFYING CREDENTIALS...' : 'ACCESS COMMAND DECK'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Pre-fill */}
        <div className="pt-4 border-t border-cyber-border/70 text-center">
          <button
            type="button"
            onClick={fillDefaultAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800 text-xs font-mono text-purple-300 transition"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Fill Default Admin Credentials</span>
          </button>
        </div>
      </div>
    </div>
  );
};
