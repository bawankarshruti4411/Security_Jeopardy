import React from 'react';
import { Shield, Award, Users, AlertCircle, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-cyber-border bg-cyber-surface/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Organization */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="font-mono font-bold tracking-wider text-slate-100 text-sm">
                SECURITY JEOPARDY 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              A high-intensity, time-bound college cybersecurity competition engineered to test
              practical threat analysis, cryptography, network defense, and campus-wide tactical flag
              reconnaissance.
            </p>
            <div className="flex items-center gap-2 text-xs text-cyan-300/80 font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse" />
              Organized by CyberGuardian Club
            </div>
          </div>

          {/* Coordinators & Leadership */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              Event Leadership
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-lg bg-cyber-card/60 border border-cyber-border/70">
                <div className="text-[11px] text-slate-400 font-mono">Faculty Coordinator</div>
                <div className="font-semibold text-slate-200">Prof. Firdous Sadaf</div>
              </div>
              <div className="p-2 rounded-lg bg-cyber-card/60 border border-cyber-border/70">
                <div className="text-[11px] text-slate-400 font-mono">SRC Coordinator</div>
                <div className="font-semibold text-slate-200">Dr. Snehlata Wankhede</div>
              </div>
            </div>
          </div>

          {/* Fair Play & Help */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Competition Integrity
            </h4>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Strict anti-tampering protocol</li>
              <li>Unique team-isolated flags</li>
              <li>Max 3 attempts per riddle</li>
              <li>Respect all campus safety zones</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-cyber-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; 2026 CyberGuardian Club &middot; All Rights Reserved.
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="text-slate-400">SOLVE</span>
            <span>&rarr;</span>
            <span className="text-slate-400">DECODE</span>
            <span>&rarr;</span>
            <span className="text-slate-400">LOCATE</span>
            <span>&rarr;</span>
            <span className="text-slate-400">HUNT</span>
            <span>&rarr;</span>
            <span className="text-cyan-400 font-bold">SUBMIT</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
