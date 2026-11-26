import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { HttpTypes } from "@medusajs/types";
import { useQueryClient } from "@tanstack/react-query";
import type { AppUser } from "@/types";
import { sdk } from "@/lib/medusa/sdk";
import { hasBackend } from "@/lib/env";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, fullName: string): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  /** Sets a new password with the token from the reset email. */
  resetPassword(token: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const toUser = (c: HttpTypes.StoreCustomer): AppUser => ({
  id: c.id,
  email: c.email,
  fullName: [c.first_name, c.last_name].filter(Boolean).join(" "),
});

function authError(e: unknown): Error {
  const message = e instanceof Error ? e.message : "";
  if (/invalid email or password|unauthorized/i.test(message)) return new Error("That email and password don't match.");
  if (/already exists/i.test(message)) return new Error("An account with this email already exists. Try signing in.");
  return new Error(message || "Something went wrong. Please try again.");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(hasBackend);
  const qc = useQueryClient();

  const loadCustomer = useCallback(async () => {
    const { customer } = await sdk.store.customer.retrieve();
    setUser(toUser(customer));
    // Attach the guest bag to the signed-in customer.
    const cartId = localStorage.getItem("aj_cart_id");
    if (cartId) {
      await sdk.store.cart.transferCart(cartId).catch(() => undefined);
      void qc.invalidateQueries({ queryKey: ["cart"] });
    }
  }, [qc]);

  useEffect(() => {
    // Only ask Medusa who we are if this browser holds a customer token.
    if (!hasBackend || !localStorage.getItem("aj_auth_token")) {
      setLoading(false);
      return;
    }
    loadCustomer()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [loadCustomer]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await sdk.auth.login("customer", "emailpass", { email, password });
        if (typeof result !== "string") throw new Error("This sign-in method needs an extra step that the shop doesn't support yet.");
        await loadCustomer();
      } catch (e) {
        throw authError(e);
      }
    },
    [loadCustomer],
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const [first_name, ...rest] = fullName.trim().split(/\s+/);
      try {
        // register() returns a token without an actor; create the customer, then log in.
        await sdk.auth.register("customer", "emailpass", { email, password });
        await sdk.store.customer.create({ email, first_name, last_name: rest.join(" ") });
        await sdk.auth.login("customer", "emailpass", { email, password });
        await loadCustomer();
      } catch (e) {
        await sdk.auth.logout().catch(() => undefined);
        throw authError(e);
      }
    },
    [loadCustomer],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      async sendPasswordReset(email) {
        // Medusa answers the same way whether or not the account exists.
        await sdk.auth.resetPassword("customer", "emailpass", { identifier: email });
      },
      async resetPassword(token, password) {
        try {
          await sdk.auth.updateProvider("customer", "emailpass", { password }, token);
        } catch {
          throw new Error("This reset link has expired or was already used. Please request a new one.");
        }
      },
      async signOut() {
        await sdk.auth.logout().catch(() => undefined);
        setUser(null);
        localStorage.removeItem("aj_cart_id");
        qc.removeQueries({ queryKey: ["orders"] });
        qc.setQueryData(["cart"], null);
      },
    }),
    [user, loading, signIn, signUp, qc],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

