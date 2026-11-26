import { ExecArgs } from "@medusajs/framework/types"
import { seedAjDesk } from "../lib/seed-aj-desk"

/**
 * Re-runnable store setup. Only adds what is missing, so it is safe on a live
 * database:  npm run seed  (from backend/apps/backend)
 */
export default async function seed({ container }: ExecArgs) {
  await seedAjDesk(container)
}
