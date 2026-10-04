import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CountdownTimer } from './CountdownTimer';
import { EventInfo } from '../types';
import {
  Shield,
  Terminal,
  Compass,
  Trophy,
  BookOpen,
  User,
  LogOut,
  Settings,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  event: EventInfo | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, event }) => {
  const { role, team, adminUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Overview', icon: Shield },
    { id: 'online', label: 'Online Challenges', icon: Terminal, badge: '10' },
    { id: 'physical', label: 'Physical Hunt', icon: Compass, badge: '5' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'rules', label: 'Rules & Protocols', icon: BookOpen },
  ];

  const handleNav = (tab: string) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-cyber-bg/85 backdrop-blur-md border-b border-cyber-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleNav('home')}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 group-hover:border-cyan-400 group-hover:shadow-glow-cyan transition-all duration-300">
              <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400">
                  SECURITY JEOPARDY
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">CyberGuardian Club</p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNav(link.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-cyber-surface/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-cyan-400 text-black font-bold'
                          : 'bg-cyber-card text-slate-400 border border-cyber-border'
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Timer & User Profile Actions */}
          <div className="hidden md:flex items-center gap-3">
            <CountdownTimer event={event} />

            {role === 'TEAM' && team ? (
              <div className="flex items-center gap-2 pl-2 border-l border-cyber-border">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border hover:border-cyan-500/40 transition cursor-pointer"
                  onClick={() => handleNav('online')}
                  title={`Team: ${team.teamName} (${team.teamCode})`}
                >
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <div className="text-left font-mono">
                    <div className="text-xs font-bold text-slate-200">{team.teamCode}</div>
                    <div className="text-[11px] text-cyan-400 font-semibold">{team.score} pts</div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : role === 'ADMIN' ? (
              <div className="flex items-center gap-2 pl-2 border-l border-cyber-border">
                <button
                  onClick={() => handleNav('admin')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                    currentTab === 'admin'
                      ? 'bg-purple-600 text-white border-purple-400 shadow-glow-violet'
                      : 'bg-purple-950/60 text-purple-300 border-purple-800/80 hover:bg-purple-900/60'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  ADMIN PANEL
                </button>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-cyber-border">
                <button
                  onClick={() => handleNav('login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-cyber-surface border border-cyber-border transition"
                >
                  Team Login
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold shadow-glow-cyan transition"
                >
                  Register Team
                </button>
                <button
                  onClick={() => handleNav('admin-login')}
                  title="Organizer Admin Portal"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 transition"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex md:hidden items-center gap-2">
            <CountdownTimer event={event} />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white bg-cyber-surface border border-cyber-border"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 bg-cyber-surface border-b border-cyber-border space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNav(link.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-cyber-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyber-card text-cyan-400 border border-cyan-900">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 border-t border-cyber-border space-y-2">
            {role === 'TEAM' && team ? (
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-between font-mono">
                  <div>
                    <div className="text-sm font-bold text-white">{team.teamName}</div>
                    <div className="text-xs text-slate-400">{team.teamCode}</div>
                  </div>
                  <div className="text-sm font-extrabold text-cyan-400">{team.score} pts</div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : role === 'ADMIN' ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleNav('admin')}
                  className="w-full py-2.5 rounded-lg bg-purple-600 text-white font-mono font-bold text-xs"
                >
                  Admin Console
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-500/10 text-rose-400 text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNav('login')}
                  className="w-full py-2 rounded-lg bg-cyber-card border border-cyber-border text-xs font-semibold text-slate-200"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="w-full py-2 rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
