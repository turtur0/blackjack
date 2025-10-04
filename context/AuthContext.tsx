'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  username: string;
  chips: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateChips: (chips: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load from memory on mount
  useEffect(() => {
    const savedToken = (window as any).authToken;
    const savedUser = (window as any).authUser;
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    // Store in window object (memory only)
    (window as any).authToken = newToken;
    (window as any).authUser = newUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    delete (window as any).authToken;
    delete (window as any).authUser;
  };

  const updateChips = (chips: number) => {
    if (user) {
      const updatedUser = { ...user, chips };
      setUser(updatedUser);
      (window as any).authUser = updatedUser;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateChips }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}