import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { markContactMessageHandledWorkflow } from "../../../../workflows/contact/mark-contact-message-handled"
import { HandledBody } from "../validators"

/** POST /admin/contact-messages/:id — mark a message handled or not. */
export async function POST(req: MedusaRequest<HandledBody>, res: MedusaResponse) {
  const { result } = await markContactMessageHandledWorkflow(req.scope).run({
    input: { id: req.params.id, handled: req.validatedBody.handled },
  })
  res.json({ contact_message: result })
}
