'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  chips: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateChips: (chips: number) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Memory storage keys
const MEMORY_TOKEN_KEY = 'authToken';
const MEMORY_USER_KEY = 'authUser';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load auth data from memory on mount
  useEffect(() => {
    const savedToken = (window as any)[MEMORY_TOKEN_KEY];
    const savedUser = (window as any)[MEMORY_USER_KEY];

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
      // Refresh user data from database to ensure sync
      refreshUserData(savedToken, savedUser.id);
    }
  }, []);

  const refreshUserData = async (authToken: string, userId: string): Promise<void> => {
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: authToken, userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        (window as any)[MEMORY_USER_KEY] = data.user;
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const login = (newToken: string, newUser: User): void => {
    setToken(newToken);
    setUser(newUser);
    // Store in window object (memory only - not persisted)
    (window as any)[MEMORY_TOKEN_KEY] = newToken;
    (window as any)[MEMORY_USER_KEY] = newUser;
  };

  const logout = (): void => {
    setToken(null);
    setUser(null);
    // Clear from memory
    delete (window as any)[MEMORY_TOKEN_KEY];
    delete (window as any)[MEMORY_USER_KEY];
  };

  const updateChips = (chips: number): void => {
    if (user) {
      const updatedUser = { ...user, chips };
      setUser(updatedUser);
      (window as any)[MEMORY_USER_KEY] = updatedUser;
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (token && user) {
      await refreshUserData(token, user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateChips, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
