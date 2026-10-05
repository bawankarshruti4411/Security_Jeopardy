import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CompetitionGuard } from './components/CompetitionGuard';
import { Home } from './pages/Home';
import { Rules } from './pages/Rules';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { AdminLogin } from './pages/AdminLogin';
import { OnlineChallenges } from './pages/OnlineChallenges';
import { PhysicalHunt } from './pages/PhysicalHunt';
import { Leaderboard } from './pages/Leaderboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { api } from './api';
import { EventInfo } from './types';

const MainApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [event, setEvent] = useState<EventInfo | null>(null);

  const fetchEvent = async () => {
    try {
      const res = await api.getEvent();
      if (res.success) {
        setEvent(res.event);
      }
    } catch (err) {
      console.warn('Could not fetch event status:', err);
    }
  };

  useEffect(() => {
    fetchEvent();
    const interval = setInterval(fetchEvent, 8000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <Home onNavigate={setCurrentTab} event={event} />;
      case 'online':
        return <OnlineChallenges onNavigate={setCurrentTab} event={event} />;
      case 'physical':
        return <PhysicalHunt onNavigate={setCurrentTab} event={event} />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'rules':
        return <Rules onNavigate={setCurrentTab} />;
      case 'register':
        return <Register onNavigate={setCurrentTab} />;
      case 'login':
        return <Login onNavigate={setCurrentTab} />;
      case 'admin-login':
        return <AdminLogin onNavigate={setCurrentTab} />;
      case 'admin':
        return (
          <AdminDashboard
            onNavigate={setCurrentTab}
            event={event}
            onRefreshEvent={fetchEvent}
          />
        );
      default:
        return <Home onNavigate={setCurrentTab} event={event} />;
    }
  };

  return (
    <CompetitionGuard event={event}>
      <div className="min-h-screen flex flex-col bg-cyber-bg text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
        <Navbar currentTab={currentTab} onNavigate={setCurrentTab} event={event} />
        <main className="flex-1">{renderContent()}</main>
        <Footer />
      </div>
    </CompetitionGuard>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
