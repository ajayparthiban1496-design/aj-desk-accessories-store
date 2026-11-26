import Medusa from "@medusajs/js-sdk";
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from "@/lib/env";

/** The one Medusa JS SDK instance for the storefront. Customer tokens are kept in localStorage. */
export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  publishableKey: MEDUSA_PUBLISHABLE_KEY,
  auth: { type: "jwt", jwtTokenStorageMethod: "local", jwtTokenStorageKey: "aj_auth_token" },
});

/** Turns any SDK/network error into a sentence a shopper can read. */
export function friendlyError(e: unknown, fallback = "Something went wrong. Please try again.") {
  const message = e instanceof Error ? e.message : "";
  if (!message || /failed to fetch|networkerror|load failed/i.test(message)) {
    return "We can't reach the shop right now. Please check your connection and try again.";
  }
  return message.length > 160 ? fallback : message;
}
