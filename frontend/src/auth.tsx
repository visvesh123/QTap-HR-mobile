import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, getToken, setToken, clearToken, getStoredPermissions, setStoredPermissions } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'staff' | 'admin';
  department?: string;
  student_id?: string;
  employee_id?: string;
  avatar?: string | null;
  phone?: string;
  qid?: string;
  gender?: string;
  type?: string;
  designation?: string;
  entity?: string;
  school?: string;
  batch?: string;
  program?: string;
  course_allotted?: string;
  academic_status?: string;
  blood_group?: string | null;
  date_of_admission?: string | null;
  designated_locations?: any[];
  permissions?: string[];
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role?: string) => Promise<void>;
  setSession: (token: string, user: User, permissions?: string[]) => Promise<void>;
  refreshUser: (force?: boolean) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function withPermissions(user: User, permissions?: string[]): User {
  const merged = permissions ?? user.permissions ?? [];
  const normalized = Array.from(
    new Set(
      merged
        .filter((p): p is string => typeof p === 'string')
        .map((p) => p.trim())
        .filter(Boolean),
    ),
  );
  return { ...user, permissions: normalized };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await getToken();
      if (t) {
        try {
          const [me, storedPermissions] = await Promise.all([api.me(), getStoredPermissions()]);
          setUser(withPermissions(me, storedPermissions.length > 0 ? storedPermissions : me?.permissions));
        } catch {
          await clearToken();
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string, role?: string) => {
    const res = await api.login(email, password, role);
    await setToken(res.token);
    const next = withPermissions(res.user, res.permissions);
    await setStoredPermissions(next.permissions ?? []);
    setUser(next);
  };

  const setSession = async (token: string, u: User, permissions?: string[]) => {
    await setToken(token);
    const next = withPermissions(u, permissions);
    await setStoredPermissions(next.permissions ?? []);
    setUser(next);
  };

  const refreshUser = async (force = false) => {
    const t = await getToken();
    if (!t) return;
    const me = await api.me(force);
    setUser((prev) => withPermissions(me, prev?.permissions ?? me?.permissions));
  };

  const hasPermission = (permission: string) => {
    if (!permission) return true;
    const normalizedPermission = permission.toLowerCase();
    const granted = new Set((user?.permissions ?? []).map((p) => String(p).toLowerCase()));
    return granted.has(normalizedPermission);
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, setSession, refreshUser, hasPermission, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
