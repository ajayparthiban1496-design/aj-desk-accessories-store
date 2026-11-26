import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createContactMessageWorkflow } from "../../../workflows/contact/create-contact-message"
import { ContactMessageBody } from "./validators"

/**
 * POST /store/contact-messages
 * Saves a contact-form message; the team reads them in Admin -> Messages.
 * The body is validated by the middleware in src/api/middlewares.ts.
 */
export async function POST(req: MedusaRequest<ContactMessageBody>, res: MedusaResponse) {
  await createContactMessageWorkflow(req.scope).run({ input: req.validatedBody })
  res.status(201).json({ received: true })
}
