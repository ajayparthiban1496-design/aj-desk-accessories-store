import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateProductOptionsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import CATALOG from "../data/aj-desk-catalog.json"
import { DEFAULT_REGION_STORE_POLICIES } from "./region-store-policies"

export const STORE_NAME = "Aj Desk"
export const SALES_CHANNEL_NAME = "Aj Desk Storefront"
export const PUBLISHABLE_KEY_TITLE = "Aj Desk Web Key"
const REGION_NAME = "India"
const STOCK_LOCATION_NAME = "Chennai Studio"
const FULFILLMENT_SET_NAME = "India delivery"
const SHIPPING_OPTION_NAME = "Standard Delivery"
const PRICE_LIST_TITLE = "Launch offer"
export const SHIPPING_RATE = 149
export const FREE_SHIPPING_THRESHOLD = 1999
const GST_RATE = 18

type CatalogProduct = (typeof CATALOG.products)[number]

/**
 * Sets up the Aj Desk store. Safe to run any number of times: every step
 * looks for what it would create and only fills in what is missing, so
 * changes made in Medusa Admin are never overwritten.
 *
 * Runs automatically on the first `medusa db:migrate` (see
 * src/migration-scripts/initial-data-seed.ts) and on demand with
 * `npm run seed`.
 */
export async function seedAjDesk(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const fulfillment = container.resolve(Modules.FULFILLMENT)

  // 1. Sales channel + publishable key
  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
    filters: { name: SALES_CHANNEL_NAME },
  })
  let salesChannel: { id: string } | undefined = channels[0]
  if (!salesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: SALES_CHANNEL_NAME, description: "The aj-desk website" }] },
    })
    salesChannel = result[0]
    logger.info(`Created sales channel "${SALES_CHANNEL_NAME}".`)
  }

  const { data: keys } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "sales_channels.id"],
    filters: { type: "publishable" },
  })
  let key: { id: string; sales_channels?: ({ id: string } | null)[] | null } | undefined = keys.find(
    (k) => k.title === PUBLISHABLE_KEY_TITLE
  )
  if (!key) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: { api_keys: [{ title: PUBLISHABLE_KEY_TITLE, type: "publishable", created_by: "" }] },
    })
    key = { id: result[0].id, sales_channels: [] }
    logger.info(`Created publishable key "${PUBLISHABLE_KEY_TITLE}".`)
  }
  if (!(key.sales_channels ?? []).some((sc: { id: string } | null) => sc?.id === salesChannel.id)) {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: key.id, add: [salesChannel.id] },
    })
  }

  // 2. Store: INR, Aj Desk name, storefront sales channel
  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "name", "default_sales_channel_id", "supported_currencies.currency_code", "supported_currencies.is_default", "supported_currencies.is_tax_inclusive"],
  })
  if (!stores.length) {
    await createStoresWorkflow(container).run({
      input: {
        stores: [{
          name: STORE_NAME,
          // Shop prices include GST, so INR prices are tax-inclusive.
          supported_currencies: [{ currency_code: "inr", is_default: true, is_tax_inclusive: true }],
          default_sales_channel_id: salesChannel.id,
        }],
      },
    })
    logger.info(`Created store "${STORE_NAME}".`)
  } else {
    for (const store of stores) {
      const currencies = (store.supported_currencies ?? []) as { currency_code: string; is_default?: boolean; is_tax_inclusive?: boolean }[]
      const ok =
        currencies.some((c) => c.currency_code === "inr" && c.is_default && c.is_tax_inclusive) &&
        store.default_sales_channel_id === salesChannel.id
      if (ok) continue
      await updateStoresWorkflow(container).run({
        input: {
          selector: { id: store.id },
          update: {
            name: STORE_NAME,
            default_sales_channel_id: salesChannel.id,
            supported_currencies: [
              { currency_code: "inr", is_default: true, is_tax_inclusive: true },
              ...currencies
                .filter((c) => c.currency_code !== "inr")
                .map((c) => ({ currency_code: c.currency_code, is_default: false, is_tax_inclusive: c.is_tax_inclusive })),
            ],
          },
        },
      })
      logger.info(`Store "${store.name}" now defaults to tax-inclusive INR and "${SALES_CHANNEL_NAME}".`)
    }
  }

  // 3. India region: INR, GST-inclusive prices, manual payment (pay on delivery)
  const { data: regions } = await query.graph({ entity: "region", fields: ["id"], filters: { name: REGION_NAME } })
  let region: { id: string } | undefined = regions[0]
  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [{
          name: REGION_NAME,
          currency_code: "inr",
          countries: ["in"],
          payment_providers: ["pp_system_default"],
          automatic_taxes: true,
          is_tax_inclusive: true,
          metadata: DEFAULT_REGION_STORE_POLICIES,
        }],
      },
    })
    region = result[0]
    logger.info(`Created region "${REGION_NAME}" (INR, tax-inclusive).`)
  }

  const { data: taxRegions } = await query.graph({ entity: "tax_region", fields: ["id"], filters: { country_code: "in" } })
  if (!taxRegions.length) {
    await createTaxRegionsWorkflow(container).run({
      input: [{
        country_code: "in",
        provider_id: "tp_system",
        default_tax_rate: { rate: GST_RATE, code: `GST${GST_RATE}`, name: `GST ${GST_RATE}%` },
      }],
    })
    logger.info(`Created India tax region with GST ${GST_RATE}%.`)
  }

  // 4. Stock location + fulfillment (manual provider, India-wide service zone)
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "sales_channels.id"],
    filters: { name: STOCK_LOCATION_NAME },
  })
  let location: { id: string; sales_channels?: ({ id: string } | null)[] | null } | undefined = locations[0]
  if (!location) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: { locations: [{ name: STOCK_LOCATION_NAME, address: { city: "Chennai", country_code: "IN", address_1: "" } }] },
    })
    location = { id: result[0].id, sales_channels: [] }
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    })
    logger.info(`Created stock location "${STOCK_LOCATION_NAME}".`)
  }
  if (!(location.sales_channels ?? []).some((sc: { id: string } | null) => sc?.id === salesChannel.id)) {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: location.id, add: [salesChannel.id] },
    })
  }

  const { data: [shippingProfile] } = await query.graph({ entity: "shipping_profile", fields: ["id"] })
  if (!shippingProfile) throw new MedusaError(MedusaError.Types.NOT_FOUND, "No shipping profile found; run `medusa db:migrate` first.")

  let [fulfillmentSet] = await fulfillment.listFulfillmentSets(
    { name: FULFILLMENT_SET_NAME },
    { relations: ["service_zones"] }
  )
  if (!fulfillmentSet) {
    fulfillmentSet = await fulfillment.createFulfillmentSets({
      name: FULFILLMENT_SET_NAME,
      type: "shipping",
      service_zones: [{ name: "India", geo_zones: [{ country_code: "in", type: "country" }] }],
    })
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    })
    logger.info(`Created fulfillment set "${FULFILLMENT_SET_NAME}".`)
  }

  const { data: options } = await query.graph({ entity: "shipping_option", fields: ["id"], filters: { name: SHIPPING_OPTION_NAME } })
  if (!options.length) {
    await createShippingOptionsWorkflow(container).run({
      input: [{
        name: SHIPPING_OPTION_NAME,
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: { label: "Standard", description: "Ships within 24 hours. 2–4 days to metros, 4–7 days elsewhere.", code: "standard" },
        prices: [
          { currency_code: "inr", amount: SHIPPING_RATE },
          { region_id: region.id, amount: SHIPPING_RATE },
          // Free shipping from the threshold (cart item total, tax-inclusive).
          { currency_code: "inr", amount: 0, rules: [{ attribute: "item_total", operator: "gte", value: FREE_SHIPPING_THRESHOLD }] },
          { region_id: region.id, amount: 0, rules: [{ attribute: "item_total", operator: "gte", value: FREE_SHIPPING_THRESHOLD }] },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      }],
    })
    logger.info(`Created "${SHIPPING_OPTION_NAME}" (₹${SHIPPING_RATE}, free from ₹${FREE_SHIPPING_THRESHOLD}).`)
  }

  // 5. Categories
  const categoryIds = new Map<string, string>()
  for (const c of CATALOG.categories) {
    const { data: [found] } = await query.graph({ entity: "product_category", fields: ["id"], filters: { handle: c.handle } })
    if (found) {
      categoryIds.set(c.handle, found.id)
      continue
    }
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [{
          name: c.name,
          handle: c.handle,
          description: c.description,
          rank: c.rank,
          is_active: true,
          is_internal: false,
          metadata: { image: c.image },
        }],
      },
    })
    categoryIds.set(c.handle, result[0].id)
    logger.info(`Created category "${c.name}".`)
  }

  // 6. Products (only those whose handle doesn't exist yet)
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["handle"],
    filters: { handle: CATALOG.products.map((p) => p.handle) },
  })
  const existingHandles = new Set(existing.map((p) => p.handle))
  const missing = CATALOG.products.filter((p) => !existingHandles.has(p.handle))
  if (missing.length) {
    await createProductsWorkflow(container).run({
      input: { products: missing.map((p) => toProductInput(p, salesChannel.id, shippingProfile.id, categoryIds)) },
    })
    logger.info(`Created ${missing.length} products.`)
  }

  // 6b. Finish order: give option values a rank where none is set yet, so the
  // storefront lists finishes as in the catalogue (Admin can reorder them later).
  const { data: optionRows } = await query.graph({
    entity: "product",
    fields: ["handle", "options.id", "options.title", "options.values.value", "options.values.rank"],
    filters: { handle: CATALOG.products.map((p) => p.handle) },
  })
  for (const row of optionRows) {
    const finish = (row.options ?? []).find((o) => o?.title === "Finish")
    const unranked = finish && ((finish.values ?? []) as ({ rank?: number | null } | null)[]).every((v) => v?.rank == null)
    const source = CATALOG.products.find((p) => p.handle === row.handle)
    if (!finish || !unranked || !source) continue
    await updateProductOptionsWorkflow(container).run({
      input: {
        selector: { id: finish.id },
        update: { ranks: Object.fromEntries(source.variants.map((v, i) => [v.title, i])) },
      },
    })
    logger.info(`Ordered the finishes of "${row.handle}".`)
  }

  // 7. Stock for inventory items that have no level at the studio yet
  const stockBySku = new Map(CATALOG.products.flatMap((p) => p.variants.map((v) => [v.sku, v.stock] as const)))
  const { data: items } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku", "location_levels.location_id"],
  })
  const levels = items
    .filter((i) => !(i.location_levels ?? []).some((l: { location_id: string } | null) => l?.location_id === location.id))
    .map((i) => ({
      inventory_item_id: i.id,
      location_id: location.id,
      stocked_quantity: stockBySku.get(i.sku ?? "") ?? Number(process.env.DEFAULT_STOCK_QUANTITY || 10),
    }))
  if (levels.length) {
    await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: levels } })
    logger.info(`Stocked ${levels.length} inventory items at "${STOCK_LOCATION_NAME}".`)
  }

  // 8. Sale prices: variants are priced at the "compare at" price, and this
  // sale price list holds the current price, so the storefront can show both.
  const { data: priceLists } = await query.graph({ entity: "price_list", fields: ["id"], filters: { title: PRICE_LIST_TITLE } })
  if (!priceLists.length) {
    const onSale = CATALOG.products.filter((p) => p.compare_at_price && p.compare_at_price > p.price)
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "sku"],
      filters: { sku: onSale.flatMap((p) => p.variants.map((v) => v.sku)) },
    })
    const priceBySku = new Map(onSale.flatMap((p) => p.variants.map((v) => [v.sku, p.price] as const)))
    const prices = variants
      .filter((v) => v.sku && priceBySku.has(v.sku))
      .map((v) => ({ variant_id: v.id, currency_code: "inr", amount: priceBySku.get(v.sku!)! }))
    if (prices.length) {
      await createPriceListsWorkflow(container).run({
        input: {
          price_lists_data: [{
            title: PRICE_LIST_TITLE,
            description: "Introductory prices shown with the original price struck through.",
            status: "active",
            prices,
          }],
        },
      })
      logger.info(`Created price list "${PRICE_LIST_TITLE}" for ${prices.length} variants.`)
    }
  }

  logger.info("Aj Desk store is ready.")
}

function toProductInput(
  p: CatalogProduct,
  salesChannelId: string,
  shippingProfileId: string,
  categoryIds: Map<string, string>
) {
  const basePrice = p.compare_at_price && p.compare_at_price > p.price ? p.compare_at_price : p.price
  return {
    title: p.title,
    subtitle: p.subtitle,
    handle: p.handle,
    description: p.description,
    status: ProductStatus.PUBLISHED,
    thumbnail: p.images[0],
    images: p.images.map((url) => ({ url })),
    category_ids: categoryIds.has(p.category) ? [categoryIds.get(p.category)!] : [],
    shipping_profile_id: shippingProfileId,
    sales_channels: [{ id: salesChannelId }],
    material: p.specs.Material,
    metadata: {
      storefront_id: p.storefront_id,
      features: p.features,
      specs: p.specs,
      badge: p.badge ?? "",
      featured: p.featured,
      launched_at: p.created_at,
    },
    options: [{
      title: "Finish",
      values: p.variants.map((v) => v.title),
      ranks: Object.fromEntries(p.variants.map((v, i) => [v.title, i])),
    }],
    variants: p.variants.map((v) => ({
      title: v.title,
      sku: v.sku,
      manage_inventory: true,
      allow_backorder: false,
      options: { Finish: v.title },
      metadata: { swatch: v.swatch },
      prices: [{ amount: basePrice, currency_code: "inr" }],
    })),
  }
}
