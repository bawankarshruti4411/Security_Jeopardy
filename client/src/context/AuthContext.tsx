import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';
import { TeamProfile } from '../types';

interface AuthContextType {
  token: string | null;
  role: 'TEAM' | 'ADMIN' | null;
  team: TeamProfile | null;
  adminUser: { id: string; email: string; name: string } | null;
  isLoading: boolean;
  loginAsTeam: (token: string, team: TeamProfile) => void;
  loginAsAdmin: (token: string, admin: any) => void;
  logout: () => void;
  refreshTeam: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sj_token'));
  const [role, setRole] = useState<'TEAM' | 'ADMIN' | null>(() => {
    return (localStorage.getItem('sj_role') as any) || null;
  });
  const [team, setTeam] = useState<TeamProfile | null>(() => {
    const saved = localStorage.getItem('sj_team');
    return saved ? JSON.parse(saved) : null;
  });
  const [adminUser, setAdminUser] = useState<any>(() => {
    const saved = localStorage.getItem('sj_admin');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    const storedToken = localStorage.getItem('sj_token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      if (data.role === 'TEAM' && data.team) {
        setRole('TEAM');
        setTeam(data.team);
        localStorage.setItem('sj_team', JSON.stringify(data.team));
      } else if (data.role === 'ADMIN') {
        setRole('ADMIN');
        setAdminUser(data.user);
      }
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const loginAsTeam = (newToken: string, teamData: TeamProfile) => {
    setToken(newToken);
    setRole('TEAM');
    setTeam(teamData);
    setAdminUser(null);
    localStorage.setItem('sj_token', newToken);
    localStorage.setItem('sj_role', 'TEAM');
    localStorage.setItem('sj_team', JSON.stringify(teamData));
    localStorage.removeItem('sj_admin');
  };

  const loginAsAdmin = (newToken: string, adminData: any) => {
    setToken(newToken);
    setRole('ADMIN');
    setAdminUser(adminData);
    setTeam(null);
    localStorage.setItem('sj_token', newToken);
    localStorage.setItem('sj_role', 'ADMIN');
    localStorage.setItem('sj_admin', JSON.stringify(adminData));
    localStorage.removeItem('sj_team');
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setTeam(null);
    setAdminUser(null);
    localStorage.removeItem('sj_token');
    localStorage.removeItem('sj_role');
    localStorage.removeItem('sj_team');
    localStorage.removeItem('sj_admin');
  };

  const refreshTeam = async () => {
    try {
      const data = await api.getMe();
      if (data.team) {
        setTeam(data.team);
        localStorage.setItem('sj_team', JSON.stringify(data.team));
      }
    } catch (err) {
      console.error('Failed to refresh team:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        team,
        adminUser,
        isLoading,
        loginAsTeam,
        loginAsAdmin,
        logout,
        refreshTeam,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
