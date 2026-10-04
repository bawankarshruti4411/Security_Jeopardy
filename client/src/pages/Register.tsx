import React, { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Shield, UserPlus, Users, Mail, Lock, CheckCircle2, AlertCircle, Copy, ArrowRight } from 'lucide-react';

interface RegisterProps {
  onNavigate: (tab: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { loginAsTeam } = useAuth();

  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [member2, setMember2] = useState('');
  const [member3, setMember3] = useState('');
  const [member4, setMember4] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Success modal state
  const [registeredCode, setRegisteredCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!teamName.trim() || !captainName.trim() || !email.trim() || !password) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const memberNames = [captainName.trim(), member2.trim(), member3.trim(), member4.trim()].filter(
      Boolean
    );

    setIsLoading(true);
    try {
      const res = await api.registerTeam({
        teamName: teamName.trim(),
        captainName: captainName.trim(),
        memberNames,
        email: email.trim(),
        password,
      });

      if (res.success && res.token) {
        loginAsTeam(res.token, res.team);
        setRegisteredCode(res.teamCode);
      } else {
        setError('Registration could not be completed.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!registeredCode) return;
    navigator.clipboard.writeText(registeredCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Registration Success Modal */}
      {registeredCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full p-6 rounded-2xl bg-cyber-surface border border-cyan-500/50 shadow-glow-cyan space-y-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold font-mono text-white">TEAM REGISTRATION COMPLETE</h2>
              <p className="text-xs text-slate-300">
                Your team has been authenticated into Security Jeopardy. Keep your unique Team Code
                safe:
              </p>
            </div>

            <div className="p-4 rounded-xl bg-cyber-bg border border-cyan-500/40 font-mono flex items-center justify-between">
              <div className="text-left">
                <div className="text-[10px] text-slate-400">ASSIGNED TEAM CODE</div>
                <div className="text-2xl font-black text-cyan-400 tracking-widest">{registeredCode}</div>
              </div>
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 rounded-lg bg-cyber-card border border-cyber-border hover:border-cyan-400 text-xs text-slate-300 flex items-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <button
              onClick={() => onNavigate('online')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold text-sm tracking-wide shadow-glow-cyan flex items-center justify-center gap-2 transition"
            >
              <span>ENTER CHALLENGE ARENA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Registration Card */}
      <div className="p-8 rounded-2xl bg-cyber-surface/90 border border-cyber-border shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-mono text-slate-100">REGISTER NEW TEAM</h1>
          <p className="text-xs text-slate-400">
            Enroll your squad into the Security Jeopardy competition arena.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team Name */}
          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300">Team Name *</label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. ZeroDay Knights"
              className="w-full px-3.5 py-2.5 rounded-xl bg-cyber-card border border-cyber-border focus:border-cyan-400 focus:outline-none text-slate-100 text-sm font-sans"
            />
          </div>

          {/* Captain Name */}
          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300">Captain Name *</label>
            <input
              type="text"
              required
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              placeholder="Captain Full Name"
              className="w-full px-3.5 py-2.5 rounded-xl bg-cyber-card border border-cyber-border focus:border-cyan-400 focus:outline-none text-slate-100 text-sm font-sans"
            />
          </div>

          {/* Members */}
          <div className="space-y-2 pt-2 border-t border-cyber-border/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Additional Squad Members (Optional, up to 4 total)
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={member2}
                onChange={(e) => setMember2(e.target.value)}
                placeholder="Member 2"
                className="px-3 py-2 rounded-lg bg-cyber-card border border-cyber-border focus:border-cyan-400 focus:outline-none text-xs text-slate-200"
              />
              <input
                type="text"
                value={member3}
                onChange={(e) => setMember3(e.target.value)}
                placeholder="Member 3"
                className="px-3 py-2 rounded-lg bg-cyber-card border border-cyber-border focus:border-cyan-400 focus:outline-none text-xs text-slate-200"
              />
              <input
                type="text"
                value={member4}
                onChange={(e) => setMember4(e.target.value)}
                placeholder="Member 4"
                className="px-3 py-2 rounded-lg bg-cyber-card border border-cyber-border focus:border-cyan-400 focus:outline-none text-xs text-slate-200"
              />
            </div>
          </div>

          {/* Captain Email */}
          <div className="space-y-1 pt-2 border-t border-cyber-border/60">
            <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              Captain Contact Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="captain@college.edu"
              className="w-full px-3.5 py-2.5 rounded-xl bg-cyber-card border border-cyber-border focus:border-cyan-400 focus:outline-none text-slate-100 text-sm font-sans"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              Team Password * (min 6 chars)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-cyber-card border border-cyber-border focus:border-cyan-400 focus:outline-none text-slate-100 text-sm font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold text-sm tracking-wide shadow-glow-cyan transition disabled:opacity-50"
          >
            {isLoading ? 'ENROLLING SQUAD...' : 'COMPLETE REGISTRATION'}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Already registered?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-cyan-400 font-semibold hover:underline"
            >
              Sign In with Team Code
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
