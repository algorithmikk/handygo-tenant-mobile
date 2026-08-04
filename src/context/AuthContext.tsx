import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '@/src/services/authService';
import type { User, Tenant, LoginRequest, AuthResponse } from '@/src/types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tenant: Tenant | null;
  login: (credentials: LoginRequest) => Promise<void>;
  setSession: (res: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  tenant: null,
  login: async () => {},
  setSession: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await authService.getToken();
        if (!token) return;
        const storedUser = await authService.getStoredUser();
        const storedTenant = await authService.getStoredTenant();
        if (storedUser) {
          setUser(storedUser);
          setTenant(storedTenant);
        }
      } catch (e) {
        console.error('Auth restore error:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (credentials: LoginRequest) => {
    const res = await authService.login(credentials);
    setUser(res.user);
    setTenant(res.tenant ?? null);
  };

  const setSession = async (res: AuthResponse) => {
    const applied = await authService.applySession(res);
    setUser(applied.user);
    setTenant(applied.tenant ?? null);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        tenant,
        login,
        setSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
