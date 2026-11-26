import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import type { AppUser } from "@/types";
import { supabase } from "@/lib/supabase";
import { appUrl } from "@/lib/utils";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, fullName: string): Promise<{ needsConfirmation: boolean }>;
  signInWithMagicLink(email: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* Demo-mode auth (no Supabase configured).
 * Stores accounts in localStorage with a SHA-256 hash — for local previews
 * only. Any email beginning with "admin@" gets the admin role so the
 * dashboard can be explored. */
const DEMO_USERS = "aj-demo-users";
const DEMO_SESSION = "aj-demo-session";
type DemoRecord = AppUser & { hash: string };

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const demoUsers = (): DemoRecord[] => JSON.parse(localStorage.getItem(DEMO_USERS) ?? "[]") as DemoRecord[];

async function loadProfile(id: string, email: string, metaName?: string): Promise<AppUser> {
  const { data } = await supabase!.from("profiles").select("full_name, role").eq("id", id).maybeSingle();
  return { id, email, fullName: data?.full_name ?? metaName ?? "", role: data?.role === "admin" ? "admin" : "customer" };
}

function notInDemo(feature: string): never {
  throw new Error(`${feature} needs Supabase configured. In demo mode, please use email and password.`);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      const id = localStorage.getItem(DEMO_SESSION);
      const rec = demoUsers().find((u) => u.id === id);
      if (rec) setUser({ id: rec.id, email: rec.email, fullName: rec.fullName, role: rec.role });
      setLoading(false);
      return;
    }
    const sync = async (session: Session | null) => {
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }
      const u = session.user;
      setUser(await loadProfile(u.id, u.email ?? "", u.user_metadata?.full_name as string | undefined));
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data }) => sync(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer so we don't run queries inside the auth callback.
      setTimeout(() => void sync(session), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message === "Invalid login credentials" ? "That email and password don't match." : error.message);
      return;
    }
    const hash = await sha256(password);
    const rec = demoUsers().find((u) => u.email === email.toLowerCase() && u.hash === hash);
    if (!rec) throw new Error("That email and password don't match.");
    localStorage.setItem(DEMO_SESSION, rec.id);
    setUser({ id: rec.id, email: rec.email, fullName: rec.fullName, role: rec.role });
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: appUrl("/account") },
      });
      if (error) throw new Error(error.message);
      return { needsConfirmation: !data.session };
    }
    const users = demoUsers();
    const lower = email.toLowerCase();
    if (users.some((u) => u.email === lower)) throw new Error("An account with this email already exists.");
    const rec: DemoRecord = {
      id: "u-" + crypto.randomUUID(),
      email: lower,
      fullName,
      role: lower.startsWith("admin@") ? "admin" : "customer",
      hash: await sha256(password),
    };
    localStorage.setItem(DEMO_USERS, JSON.stringify([...users, rec]));
    localStorage.setItem(DEMO_SESSION, rec.id);
    setUser({ id: rec.id, email: rec.email, fullName, role: rec.role });
    return { needsConfirmation: false };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      async signInWithMagicLink(email) {
        if (!supabase) notInDemo("Magic link sign-in");
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: appUrl("/account") } });
        if (error) throw new Error(error.message);
      },
      async signInWithGoogle() {
        if (!supabase) notInDemo("Google sign-in");
        const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: appUrl("/account") } });
        if (error) throw new Error(error.message);
      },
      async sendPasswordReset(email) {
        if (!supabase) notInDemo("Password reset email");
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl("/reset-password") });
        if (error) throw new Error(error.message);
      },
      async updatePassword(password) {
        if (supabase) {
          const { error } = await supabase.auth.updateUser({ password });
          if (error) throw new Error(error.message);
          return;
        }
        if (!user) throw new Error("Please sign in first.");
        const hash = await sha256(password);
        localStorage.setItem(DEMO_USERS, JSON.stringify(demoUsers().map((u) => (u.id === user.id ? { ...u, hash } : u))));
      },
      async signOut() {
        if (supabase) await supabase.auth.signOut();
        localStorage.removeItem(DEMO_SESSION);
        setUser(null);
      },
    }),
    [user, loading, signIn, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
