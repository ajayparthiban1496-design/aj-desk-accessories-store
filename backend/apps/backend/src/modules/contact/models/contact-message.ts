import { model } from "@medusajs/framework/utils"

const ContactMessage = model.define("contact_message", {
  id: model.id({ prefix: "cmsg" }).primaryKey(),
  name: model.text(),
  email: model.text().searchable(),
  topic: model.text(),
  message: model.text(),
  handled: model.boolean().default(false),
})

export default ContactMessage
