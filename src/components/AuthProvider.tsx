"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { isCampus } from "@/lib/campus";
import { getRepo } from "@/lib/data";
import type { AuthUser, Profile } from "@/lib/types";
import { Spinner } from "./ui";

type AuthState = {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<Profile | null>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const p = await getRepo().getMe();
      setProfile(p);
      return p;
    } catch {
      return null;
    }
  }, []);

  const router = useRouter();

  useEffect(() => {
    const repo = getRepo();
    let alive = true;

    const apply = async (u: AuthUser | null) => {
      if (u && !isCampus(u.email)) {
        await repo.signOut();
        setUser(null);
        setProfile(null);
        router.replace("/login?error=campus");
        return;
      }
      setUser(u);
      try {
        setProfile(u ? await repo.getMe() : null);
      } catch (e) {
        console.error("Profil gagal dimuat", e);
        setProfile(null);
      }
    };

    (async () => {
      try {
        await apply(await repo.getUser());
      } catch (e) {
        console.error("Sesi gagal dimuat", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    const off = repo.onAuthChange((u) => void apply(u));
    return () => {
      alive = false;
      off();
    };
  }, [router]);

  return <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function RequireProfile({ children }: { children: (profile: Profile) => ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const ready = !loading && user && profile?.quizAnswers;

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(path)}`);
    else if (!profile?.quizAnswers) router.replace("/onboarding");
  }, [loading, user, profile, router, path]);

  if (!ready) return <Spinner />;
  return <>{children(profile!)}</>;
}
