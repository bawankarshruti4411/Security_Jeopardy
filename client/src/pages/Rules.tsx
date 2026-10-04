import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Flame,
  Key,
  Compass,
  FileText,
  Clock,
  Award,
} from 'lucide-react';

interface RulesProps {
  onNavigate: (tab: string) => void;
}

export const Rules: React.FC<RulesProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-16 px-4">
      {/* Header */}
      <div className="text-center space-y-3 pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs">
          <BookOpen className="w-3.5 h-3.5" />
          OFFICIAL RULEBOOK & PROTOCOLS
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-100 tracking-tight">
          SECURITY JEOPARDY PROTOCOL
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Please read these rules carefully before the competition begins. All participants are
          bound by these operational directives.
        </p>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs">
            <Clock className="w-4 h-4" />
            DURATION & TIME
          </div>
          <p className="text-xs text-slate-300">
            60 minutes total operational window. Server authoritative countdown applies to all
            submissions.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-mono font-bold text-xs">
            <Flame className="w-4 h-4" />
            15 CHALLENGES
          </div>
          <p className="text-xs text-slate-300">
            10 online cyber riddles (10 pts each) + 5 physical campus flag hunts (20 pts each) = 200
            total base points.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs">
            <Key className="w-4 h-4" />
            FINAL META CIPHER
          </div>
          <p className="text-xs text-slate-300">
            Collect all 5 secret fragments (C, Y, B, E, R) to unlock and solve the final master
            keyword.
          </p>
        </div>
      </div>

      {/* Section 1: Scoring & Hint Penalties */}
      <section className="p-6 rounded-2xl bg-cyber-surface border border-cyber-border space-y-6">
        <h2 className="text-lg font-bold font-mono text-cyan-300 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          1. SCORING MATRIX & ATTEMPTS
        </h2>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cyber-border text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-3">Challenge Type</th>
                  <th className="py-2.5 px-3">Base Points</th>
                  <th className="py-2.5 px-3">Hint 1 Deduction</th>
                  <th className="py-2.5 px-3">Hint 2 Deduction</th>
                  <th className="py-2.5 px-3">Max Attempts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/60 font-mono">
                <tr>
                  <td className="py-3 px-3 text-cyan-400 font-semibold">Online Riddle (O01-O10)</td>
                  <td className="py-3 px-3">10 pts</td>
                  <td className="py-3 px-3 text-amber-400">-2 pts</td>
                  <td className="py-3 px-3 text-rose-400">-3 pts</td>
                  <td className="py-3 px-3 text-slate-200">3 attempts</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 text-purple-400 font-semibold">
                    Physical Hunt (P01-P05)
                  </td>
                  <td className="py-3 px-3">20 pts</td>
                  <td className="py-3 px-3 text-amber-400">-2 pts</td>
                  <td className="py-3 px-3 text-rose-400">-3 pts</td>
                  <td className="py-3 px-3 text-slate-200">3 attempts (Riddle)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="font-bold">Three-Strike Lockout Policy:</div>
              <p>
                If a team exhausts all 3 incorrect attempts for a riddle (online or physical), that
                challenge will be permanently marked as <strong>FAILED (0 points)</strong>. Only
                that riddle is locked; the next riddle or route step unlocks so you can keep
                playing. Verify your spelling!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Physical Flag Isolation & Anti-Cheating */}
      <section className="p-6 rounded-2xl bg-cyber-surface border border-cyber-border space-y-6">
        <h2 className="text-lg font-bold font-mono text-purple-300 flex items-center gap-2">
          <Compass className="w-5 h-5 text-purple-400" />
          2. PHYSICAL CAMPUS FLAG HUNT & ISOLATION
        </h2>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            The physical phase involves locating cryptographic markers hidden in designated campus
            zones. The system utilizes automated route rotation so different teams start at different
            locations to prevent bottlenecking.
          </p>

          <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-2">
            <div className="font-mono text-xs font-bold text-slate-200">Flag Format Structure:</div>
            <div className="p-2.5 rounded-lg bg-cyber-bg font-mono text-cyan-400 text-xs tracking-wider border border-cyber-border">
              P[Step]-SJ-T[Number]-[Fragment]-[Digits]
            </div>
            <p className="text-[11px] text-slate-400">
              Example for Team 1, Step 1: <code className="text-slate-200">P1-SJ-T001-C-47</code>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="font-bold uppercase tracking-wide">Strict Anti-Poaching Rule:</div>
              <p>
                Physical flags are <strong>team-specific</strong>. If your team submits a flag
                belonging to another team code, the submission will be rejected with the message:{' '}
                <em>"THIS FLAG BELONGS TO ANOTHER TEAM."</em> Attempting to steal, photograph, or
                destroy another team's physical flag marker will result in immediate disqualification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Campus Safety Protocol */}
      <section className="p-6 rounded-2xl bg-cyber-surface border border-cyber-border space-y-6">
        <h2 className="text-lg font-bold font-mono text-emerald-300 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
          3. CAMPUS SAFETY DIRECTIVES
        </h2>

        <ul className="space-y-2.5 text-xs text-slate-300 list-disc list-inside">
          <li>
            <strong>No Dangerous Movement:</strong> Running in hallways, jumping down stairwells, or
            reckless behavior is strictly prohibited.
          </li>
          <li>
            <strong>Restricted Areas:</strong> No flags are hidden inside electrical high-voltage
            panels, construction zones, or faculty private residences. All clues are in accessible
            public areas.
          </li>
          <li>
            <strong>Do Not Remove Markers:</strong> Leave physical flags in their placed locations so
            other teams on later rotations can discover their designated items.
          </li>
          <li>
            <strong>Volunteers & Marshals:</strong> Event volunteers are stationed across campus
            hotspots. Follow all instructions given by event marshals immediately.
          </li>
        </ul>
      </section>

      {/* Section 4: Leadership and Inquiries */}
      <section className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/20 to-purple-950/20 border border-cyber-border text-xs text-slate-400 space-y-4">
        <h3 className="font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400" />
          Competition Governance
        </h3>
        <p>
          In the event of a dispute, system malfunction, or scoring inquiry, the decision of Faculty
          Coordinator <strong>Prof. Firdous Sadaf</strong> and Club Coordinator{' '}
          <strong>Shruti Bawankar</strong> will be final.
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('online')}
            className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-mono font-bold hover:bg-cyan-400 transition"
          >
            Go to Online Challenges
          </button>
          <button
            onClick={() => onNavigate('leaderboard')}
            className="px-4 py-2 rounded-lg bg-cyber-card border border-cyber-border text-slate-300 hover:text-white transition"
          >
            Check Leaderboard
          </button>
        </div>
      </section>
    </div>
  );
};
