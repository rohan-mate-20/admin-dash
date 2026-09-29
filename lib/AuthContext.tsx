"use client";

import React, { createContext, useContext, useState, useEffect, useEffectEvent } from "react";
import { supabase } from "./supabaseClient";
import { getCurrentAdmin } from "./auth";

export type UserRole = "ADMIN" | "SUPER_ADMIN";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = async () => {
    try {
      const admin = await getCurrentAdmin();
      setCurrentUser(
        admin
          ? {
              id: admin.id,
              name: admin.name,
              email: admin.email,
              role: admin.role as UserRole,
            }
          : null
      );
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserFromAuthEffect = useEffectEvent(() => {
    void loadUser();
  });

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadUserFromAuthEffect(), 0);

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUserFromAuthEffect();
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      window.clearTimeout(initialLoad);
      listener.subscription.unsubscribe();
    };
  }, []);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role ?? null,
        isSuperAdmin,
        isAdmin,
        isLoading,
        refreshUser: loadUser,
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
