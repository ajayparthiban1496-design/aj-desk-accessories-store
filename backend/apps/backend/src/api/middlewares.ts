import {
  configureStoreSearch,
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { NewsletterSchema } from "./store/newsletter/validators"
import { ContactMessageSchema } from "./store/contact-messages/validators"
import { HandledSchema } from "./admin/contact-messages/validators"

export default defineMiddlewares({
  routes: [
    // The product index declares filterable `status` and `sales_channel_ids`, so
    // the route narrows it to published products in the key's sales channels.
    {
      method: ["POST"],
      matcher: "/store/search",
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    {
      method: ["POST"],
      matcher: "/store/newsletter",
      middlewares: [validateAndTransformBody(NewsletterSchema)],
    },
    {
      method: ["POST"],
      matcher: "/store/contact-messages",
      middlewares: [validateAndTransformBody(ContactMessageSchema)],
    },
    {
      method: ["POST"],
      matcher: "/admin/contact-messages/:id",
      middlewares: [validateAndTransformBody(HandledSchema)],
    },
  ],
})
