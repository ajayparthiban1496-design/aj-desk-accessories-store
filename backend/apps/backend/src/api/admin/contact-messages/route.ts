import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/** GET /admin/contact-messages — newest first, paginated with limit/offset. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const offset = Math.max(Number(req.query.offset) || 0, 0)
  const { data, metadata } = await query.graph({
    entity: "contact_message",
    fields: ["id", "name", "email", "topic", "message", "handled", "created_at"],
    pagination: { take: limit, skip: offset, order: { created_at: "DESC" } },
  })
  res.json({ contact_messages: data, count: metadata?.count ?? data.length, limit, offset })
}
