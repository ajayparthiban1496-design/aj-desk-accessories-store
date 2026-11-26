import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PUBLISHABLE_KEY_TITLE } from "../lib/seed-aj-desk"

/**
 * Prints the storefront's publishable API key (public by design; it goes in
 * the storefront's VITE_MEDUSA_PUBLISHABLE_KEY).
 *   npx medusa exec ./src/scripts/publishable-key.ts
 */
export default async function publishableKey({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["token", "title"],
    filters: { type: "publishable", title: PUBLISHABLE_KEY_TITLE },
  })
  if (!data.length) {
    logger.warn(`No publishable key titled "${PUBLISHABLE_KEY_TITLE}". Run the seed first.`)
    return
  }
  logger.info(`VITE_MEDUSA_PUBLISHABLE_KEY=${data[0].token}`)
}
