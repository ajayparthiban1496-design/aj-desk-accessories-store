import { z } from "@medusajs/framework/zod"

export const ContactMessageSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  topic: z.enum(["Order help", "Product question", "Corporate orders", "Press & partnerships", "Something else"]),
  message: z.string().trim().min(10).max(2000),
})

export type ContactMessageBody = z.infer<typeof ContactMessageSchema>
