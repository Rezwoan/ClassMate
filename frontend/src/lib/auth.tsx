"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, tokens } from "./api";
import type { AuthResponse, User } from "./types";

type Status = "loading" | "authed" | "guest";

interface AuthContextValue {
  user: User | null;
  status: Status;
  setSession: (res: AuthResponse) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const bootstrap = useCallback(async () => {
    if (!tokens.access) {
      setStatus("guest");
      return;
    }
    try {
      const me = await api<User>("/auth/me");
      setUser(me);
      setStatus("authed");
    } catch {
      tokens.clear();
      setStatus("guest");
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const setSession = useCallback((res: AuthResponse) => {
    tokens.set(res.accessToken, res.refreshToken);
    setUser(res.user);
    setStatus("authed");
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await api<User>("/auth/me");
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokens.refresh;
    if (refresh) {
      await api("/auth/logout", {
        method: "POST",
        body: { refreshToken: refresh },
        auth: false,
      }).catch(() => undefined);
    }
    tokens.clear();
    setUser(null);
    setStatus("guest");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, setSession, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
