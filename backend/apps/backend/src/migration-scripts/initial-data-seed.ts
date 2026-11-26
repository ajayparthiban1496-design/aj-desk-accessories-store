import { MedusaContainer } from "@medusajs/framework"
import { seedAjDesk } from "../lib/seed-aj-desk"

/**
 * Runs once, on the first `medusa db:migrate` against a database, and sets up
 * the Aj Desk store: INR India region with GST, sales channel, publishable
 * key, Chennai stock location, shipping, categories and the catalogue.
 */
export default async function initialDataSeed({ container }: { container: MedusaContainer }) {
  await seedAjDesk(container)
}
