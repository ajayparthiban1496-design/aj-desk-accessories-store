import { z } from "@medusajs/framework/zod"

export const HandledSchema = z.object({ handled: z.boolean() })

export type HandledBody = z.infer<typeof HandledSchema>
