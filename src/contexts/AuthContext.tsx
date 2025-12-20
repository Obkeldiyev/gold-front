import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, LoginResponse } from '@/lib/api';

interface User {
  role: string;
}

interface Tokens {
  access_token: string;
  refresh_token: string;
}

interface AuthContextType {
  user: User | null;
  tokens: Tokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  isSuperAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing tokens on mount
    const storedTokens = localStorage.getItem('tokens');
    const storedUser = localStorage.getItem('user');
    
    if (storedTokens && storedUser) {
      setTokens(JSON.parse(storedTokens));
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<LoginResponse> => {
    const response = await authApi.login(username, password);
    
    if (response.success && response.tokens && response.role) {
      const userData: User = { role: response.role };
      
      localStorage.setItem('tokens', JSON.stringify(response.tokens));
      localStorage.setItem('user', JSON.stringify(userData));
      
      setTokens(response.tokens);
      setUser(userData);
    }
    
    return response;
  };

  const logout = () => {
    localStorage.removeItem('tokens');
    localStorage.removeItem('user');
    setTokens(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated: !!tokens && !!user,
    login,
    logout,
    isSuperAdmin: user?.role === 'super admin',
    isManager: user?.role === 'manager',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
