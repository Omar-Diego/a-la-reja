"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import Cookies from "js-cookie";

const TOKEN_COOKIE_NAME = "auth_token";
const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const, // SEGURIDAD: Cambiado de "lax" a "strict" para mejor protección CSRF
};

export interface User {
  id: string;
  nombre: string;
  email: string;
  telefono?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  getAuthHeader: () => Record<string, string>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const userData: User = {
        id: session.user.id || "",
        nombre: session.user.name || "",
        email: session.user.email || "",
      };
      setUser(userData);

      // Get token from session and save to cookie
      const accessToken = session.accessToken as string | undefined;
      if (accessToken) {
        setToken(accessToken);
        Cookies.set(TOKEN_COOKIE_NAME, accessToken, COOKIE_OPTIONS);
      }
    } else if (status === "unauthenticated") {
      setUser(null);
      setToken(null);
      Cookies.remove(TOKEN_COOKIE_NAME);
    }
  }, [session, status]);

  useEffect(() => {
    const savedToken = Cookies.get(TOKEN_COOKIE_NAME);
    if (savedToken && !token) {
      setToken(savedToken);
    }
  }, [token]);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    Cookies.set(TOKEN_COOKIE_NAME, newToken, COOKIE_OPTIONS);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    Cookies.remove(TOKEN_COOKIE_NAME);
    await nextAuthSignOut({ callbackUrl: "/login" });
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      return { ...prevUser, ...userData };
    });
  }, []);

  const getAuthHeader = useCallback((): Record<string, string> => {
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading: status === "loading",
    login,
    logout,
    getAuthHeader,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
