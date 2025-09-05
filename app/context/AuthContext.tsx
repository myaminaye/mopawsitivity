"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthState = { name: string | null };
type AuthCtx = AuthState & { login: (name: string) => void; logout: () => void };
const Ctx = createContext<AuthCtx | null>(null);
const KEY = "fluffy_auth_v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    const s = localStorage.getItem(KEY);
    if (s) setName(JSON.parse(s).name);
  }, []);
  const login = (n: string) => {
    setName(n);
    localStorage.setItem(KEY, JSON.stringify({ name: n }));
  };
  const logout = () => {
    setName(null);
    localStorage.removeItem(KEY);
  };
  const value = useMemo(() => ({ name, login, logout }), [name]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("AuthProvider missing");
  return v;
};
