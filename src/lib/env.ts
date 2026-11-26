import { z } from "zod";

/**
 * Public build-time settings (all VITE_* values end up in the browser bundle,
 * so only public values belong here). Validated once at startup.
 */
const schema = z.object({
  // Empty in production: the Medusa backend is served from the same domain
  // (/store, /auth, /files are routed to it by vercel.json).
  VITE_MEDUSA_BACKEND_URL: z.string().url().optional().or(z.literal("")),
  VITE_MEDUSA_PUBLISHABLE_KEY: z.string().startsWith("pk_").optional().or(z.literal("")),
  VITE_SITE_URL: z.string().url().optional().or(z.literal("")),
  VITE_PLAUSIBLE_DOMAIN: z.string().optional(),
});

// Read each key explicitly: passing import.meta.env as a whole would bundle every VITE_* variable.
const parsed = schema.safeParse({
  VITE_MEDUSA_BACKEND_URL: import.meta.env.VITE_MEDUSA_BACKEND_URL,
  VITE_MEDUSA_PUBLISHABLE_KEY: import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY,
  VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
  VITE_PLAUSIBLE_DOMAIN: import.meta.env.VITE_PLAUSIBLE_DOMAIN,
});
if (!parsed.success) {
  console.error("Invalid storefront environment variables", parsed.error.flatten().fieldErrors);
}
const env = parsed.success ? parsed.data : {};

export const MEDUSA_BACKEND_URL = (env.VITE_MEDUSA_BACKEND_URL || window.location.origin).replace(/\/$/, "");
export const MEDUSA_PUBLISHABLE_KEY = env.VITE_MEDUSA_PUBLISHABLE_KEY || "";
/** Without a publishable key the shop runs from the bundled catalogue, with ordering switched off. */
export const hasBackend = Boolean(MEDUSA_PUBLISHABLE_KEY);
