"use client";

import { createContext, useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/auth";
import { canPublishRole, isAdminRole } from "@/lib/roles";
import type { Profile, Role } from "@/types/profile";

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  role: Role | null;
  /** Admin hoặc Super Admin */
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** VIP, Admin, Super Admin: đăng bài không cần duyệt */
  canPublish: boolean;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  role: null,
  isAdmin: false,
  isSuperAdmin: false,
  canPublish: false,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileFor, setProfileFor] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getProfile(user.id).then((p) => {
      if (!active) return;
      setProfile(p);
      setProfileFor(user.id);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setProfile(await getProfile(user.id));
    setProfileFor(user.id);
  }, [user]);

  const currentProfile = user && profileFor === user.id ? profile : null;
  const loading = authLoading || (!!user && profileFor !== user.id);
  const role = currentProfile?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: currentProfile,
        loading,
        role,
        isAdmin: isAdminRole(role),
        isSuperAdmin: role === "super_admin",
        canPublish: canPublishRole(role),
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
