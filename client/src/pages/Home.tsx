import React from 'react';
import { useAuth } from '../context/AuthContext';
import { EventInfo } from '../types';
import {
  Shield,
  Terminal,
  Compass,
  Trophy,
  ArrowRight,
  Flame,
  Award,
  Zap,
  Target,
  Key,
  Users,
  Search,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface HomeProps {
  onNavigate: (tab: string) => void;
  event: EventInfo | null;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, event }) => {
  const { role, team } = useAuth();

  const flowSteps = [
    {
      num: '01',
      title: 'SOLVE',
      desc: 'Crack online security riddles covering defensive barriers, protocols, threat vectors, exploits & cryptography.',
      icon: Terminal,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
    },
    {
      num: '02',
      title: 'DECODE',
      desc: 'Accurate solves unlock hidden location clues leading to physical target hotspots.',
      icon: Key,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
    },
    {
      num: '03',
      title: 'LOCATE',
      desc: 'Interpret cryptic campus physical clues and navigate to target facilities.',
      icon: Search,
      color: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30',
    },
    {
      num: '04',
      title: 'HUNT',
      desc: 'Search the location to locate your specific team flag sticker with isolation verification.',
      icon: Compass,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
    },
    {
      num: '05',
      title: 'RETURN',
      desc: 'Extract your team-specific flag code and return safely to headquarters or workstation.',
      icon: Target,
      color: 'from-pink-500/20 to-amber-500/20 text-pink-400 border-pink-500/30',
    },
    {
      num: '06',
      title: 'SUBMIT',
      desc: 'Submit the flag code to capture the fragment and unlock the ultimate meta cipher!',
      icon: CheckCircle2,
      color: 'from-amber-500/20 to-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 overflow-hidden">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center px-4 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            CYBERGUARDIAN CLUB PRESENTS
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400">
              SECURITY JEOPARDY
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed font-normal">
            The ultimate hybrid cybersecurity challenge. Blend tactical analytical cyber riddles
            with a live physical campus flag hunt. Solve puzzles, decode clues, race across
            waypoints, and assemble the master key.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {role === 'TEAM' ? (
              <button
                onClick={() => onNavigate('online')}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold text-sm tracking-wide shadow-glow-cyan transition-all flex items-center gap-2 group"
              >
                <span>ENTER CHALLENGES</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold text-sm tracking-wide shadow-glow-cyan transition-all flex items-center gap-2 group"
                >
                  <span>REGISTER TEAM</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  className="px-6 py-3.5 rounded-xl bg-cyber-card hover:bg-cyber-surface border border-cyber-border text-slate-200 font-semibold text-sm transition"
                >
                  Team Login
                </button>
              </>
            )}

            <button
              onClick={() => onNavigate('leaderboard')}
              className="px-6 py-3.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/30 text-purple-300 font-mono text-sm font-semibold transition flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-purple-400" />
              <span>LIVE LEADERBOARD</span>
            </button>
          </div>

          {/* Live Status Pill */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-cyber-surface/80 border border-cyber-border text-xs font-mono">
              <span className="text-slate-400">Current Arena Status:</span>
              <span className="font-bold text-cyan-400">
                {event ? event.status : 'INITIALIZING'}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Format:</span>
              <span className="font-bold text-slate-200">10 Online + 5 Physical</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2-Column Game Architecture Stats */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: 10 Online Challenges */}
          <div className="p-6 rounded-2xl bg-cyber-surface/80 border border-cyber-border hover:border-cyan-500/40 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Terminal className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                100 TOTAL PTS
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-mono">
                10 ONLINE CHALLENGES
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Progressive jeopardy matrix challenging your tactical understanding of network
                defense, protocols, authentication systems, threat vectors, and cryptographic integrity.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-cyber-border flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Points per solve:</span>
              <span className="text-cyan-400 font-bold">10 pts (Hint penalties apply)</span>
            </div>
          </div>

          {/* Card 2: 5 Physical Flag Hunts */}
          <div className="p-6 rounded-2xl bg-cyber-surface/80 border border-cyber-border hover:border-purple-500/40 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-purple-950 text-purple-400 border border-purple-800">
                100 TOTAL PTS
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-mono">
                5 PHYSICAL FLAG HUNTS
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Campus-wide physical hunt. Solve the digital riddle to decode real-world campus
                hotspots (Server Rack, Fire Equipment, Notice Board, Water Station, Main Gate).
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-cyber-border flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Rotating route isolation:</span>
              <span className="text-purple-400 font-bold">Anti-congestion routing</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6-Step Game Flow Section */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Zap className="w-4 h-4" />
            TACTICAL BLUEPRINT
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-mono tracking-wide text-slate-100">
            HOW SECURITY JEOPARDY WORKS
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            From algorithmic riddle analysis to campus ground reconnaissance. Follow the protocol
            strictly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {flowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-6 rounded-2xl bg-cyber-card/70 border border-cyber-border hover:border-slate-600 transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} border flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xl font-black text-slate-600">{step.num}</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold font-mono text-slate-200">{step.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Leadership Spotlight */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="p-8 rounded-2xl bg-gradient-to-r from-cyan-950/20 via-purple-950/20 to-blue-950/20 border border-cyber-border text-center space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-widest">
            <Award className="w-4 h-4" />
            Event Leadership & Patronage
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="p-4 rounded-xl bg-cyber-surface/80 border border-cyber-border space-y-1">
              <div className="text-xs font-mono text-slate-400">Faculty Coordinator</div>
              <div className="text-base font-bold text-slate-100">Prof. Firdous Sadaf</div>
              <div className="text-xs text-cyan-400 font-mono">CyberGuardian Club Mentor</div>
            </div>
            <div className="p-4 rounded-xl bg-cyber-surface/80 border border-cyber-border space-y-1">
              <div className="text-xs font-mono text-slate-400">Club Coordinator</div>
              <div className="text-base font-bold text-slate-100">Shruti Bawankar</div>
              <div className="text-xs text-purple-400 font-mono">CyberGuardian Club Coordinator</div>
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('rules')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
            >
              Read Full Competition Rules & Safety Guidelines &rarr;
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
