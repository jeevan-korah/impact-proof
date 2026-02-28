// src/context/AuthContext.tsx

import { createContext, useEffect, useState } from "react";
import type { User } from "@/types/auth.types";
import * as authApi from "@/api/auth.api";

interface AuthContextType {
  user: User | null;
  loginUser: (data: { email: string; password: string }) => Promise<void>;
  registerUser: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .getMe()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  const loginUser = async (data: { email: string; password: string }) => {
    const res = await authApi.login(data);

    localStorage.setItem("token", res.token);
    setUser(res.user);
  };

  const registerUser = async (data: any) => {
    const res = await authApi.register(data);

    localStorage.setItem("token", res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loginUser, registerUser, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
