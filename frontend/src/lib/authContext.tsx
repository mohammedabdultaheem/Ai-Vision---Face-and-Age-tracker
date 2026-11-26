"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "./types";
import { api } from "./api";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  hasRole: (minRole: UserRole) => boolean;
}

const ROLE_RANKS: Record<UserRole, number> = {
  "Super Administrator": 4,
  "Administrator": 3,
  "Operator": 2,
  "Read-only Analyst": 1,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage
    const savedToken = localStorage.getItem("aivision_token");
    const savedUser = localStorage.getItem("aivision_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("aivision_user");
      }
    } else {
      // Default to Super Admin for immediate executive dashboard evaluation
      const defaultUser: User = {
        id: 1,
        uuid: "usr-super-admin-01",
        email: "superadmin@aivision.io",
        full_name: "Dr. Elena Vance",
        role: "Super Administrator",
        department: "Executive AI Governance",
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setUser(defaultUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      localStorage.setItem("aivision_token", res.access_token);
      setToken(res.access_token);

      const profile = await api.getMe().catch(() => ({
        id: 1,
        uuid: "usr-01",
        email: res.email,
        full_name: res.user_name,
        role: res.role as UserRole,
        department: "AI Operations",
        is_active: true,
        created_at: new Date().toISOString(),
      }));

      setUser(profile);
      localStorage.setItem("aivision_user", JSON.stringify(profile));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setToken(null);
  };

  const switchDemoRole = (newRole: UserRole) => {
    const updatedUser: User = {
      id: user?.id || 1,
      uuid: user?.uuid || "usr-demo",
      email: `${newRole.toLowerCase().replace(/[^a-z]/g, "")}@aivision.io`,
      full_name: `${newRole} Demo User`,
      role: newRole,
      department: "Enterprise Verification",
      is_active: true,
      created_at: user?.created_at || new Date().toISOString(),
    };
    setUser(updatedUser);
    localStorage.setItem("aivision_user", JSON.stringify(updatedUser));
  };

  const hasRole = (minRole: UserRole): boolean => {
    if (!user) return false;
    const userRank = ROLE_RANKS[user.role] || 0;
    const requiredRank = ROLE_RANKS[minRole] || 0;
    return userRank >= requiredRank;
  };

  const role: UserRole = user?.role || "Operator";

  return (
    <AuthContext.Provider value={{ user, role, token, isLoading, login, logout, switchDemoRole, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

