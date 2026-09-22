"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "admin" | "superadmin";

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  avatarLetter: string;
  joinedDate: string;
}

export const ADMIN_USER: UserProfile = {
  name: "Admin",
  email: "admin@kmart.com",
  role: "admin",
  roleTitle: "Administrator",
  avatarLetter: "A",
  joinedDate: "12 Jan 2024",
};

export const SUPER_ADMIN_USER: UserProfile = {
  name: "Super Admin",
  email: "superadmin@kmart.com",
  role: "superadmin",
  roleTitle: "Super Administrator",
  avatarLetter: "SA",
  joinedDate: "05 Jan 2024",
};

interface AuthContextType {
  currentUser: UserProfile;
  role: UserRole;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  setRole: (role: UserRole) => void;
  login: (email: string, role?: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "kmart_admin_user_role";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default to superadmin so user can immediately experience the full feature set, or recall saved role
  const [currentUser, setCurrentUser] = useState<UserProfile>(SUPER_ADMIN_USER);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedRole = localStorage.getItem(STORAGE_KEY) as UserRole | null;
      if (savedRole === "admin") {
        setCurrentUser(ADMIN_USER);
      } else if (savedRole === "superadmin") {
        setCurrentUser(SUPER_ADMIN_USER);
      }
    } catch {
      // Ignore localStorage read errors in SSR
    }
    setIsInitialized(true);
  }, []);

  const setRole = (role: UserRole) => {
    const user = role === "superadmin" ? SUPER_ADMIN_USER : ADMIN_USER;
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY, role);
    } catch {
      // Ignore write errors
    }
  };

  const login = (email: string, explicitRole?: UserRole) => {
    let targetRole: UserRole = explicitRole || "superadmin";
    if (!explicitRole) {
      if (email.toLowerCase().includes("super")) {
        targetRole = "superadmin";
      } else if (email.toLowerCase().includes("admin")) {
        targetRole = "admin";
      }
    }
    setRole(targetRole);
  };

  const logout = () => {
    // Reset to default
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const isSuperAdmin = currentUser.role === "superadmin";
  const isAdmin = currentUser.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser.role,
        isSuperAdmin,
        isAdmin,
        setRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
