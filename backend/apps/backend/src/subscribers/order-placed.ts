import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { emailLayout, escape, sendEmail, storefrontUrl } from "../lib/email"

const inr = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)

/** Order confirmation email with items, totals (GST included) and the delivery address. */
export default async function orderPlacedHandler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: [order] } = await query.graph({
    entity: "order",
    fields: [
      "id", "display_id", "email", "total", "tax_total", "shipping_total", "discount_total",
      "items.product_title", "items.variant_title", "items.quantity", "items.total",
      "shipping_address.first_name", "shipping_address.last_name", "shipping_address.address_1",
      "shipping_address.address_2", "shipping_address.city", "shipping_address.province",
      "shipping_address.postal_code", "shipping_address.phone",
    ],
    filters: { id: data.id },
  })
  if (!order?.email) {
    return
  }
  const a = order.shipping_address
  const rows = (order.items ?? [])
    .map((i) => `<tr><td style="padding:8px 0">${escape(i?.product_title ?? "")} — ${escape(i?.variant_title ?? "")} × ${i?.quantity}</td><td align="right">${inr(Number(i?.total ?? 0))}</td></tr>`)
    .join("")
  await sendEmail(
    {
      to: order.email,
      subject: `Your Aj Desk order #${order.display_id}`,
      html: emailLayout(
        `Thank you, ${escape(a?.first_name ?? "")}.`,
        `<p style="line-height:1.6;color:#6b625a">Order #${order.display_id} is confirmed. You'll pay on delivery (cash or UPI) — we'll call to confirm before dispatch.</p>
<table role="presentation" width="100%" style="font-size:14px;border-top:1px solid #e2dbd0;margin-top:16px">${rows}
<tr><td style="padding-top:8px;color:#6b625a">Shipping</td><td align="right">${Number(order.shipping_total) === 0 ? "Free" : inr(Number(order.shipping_total))}</td></tr>
${Number(order.discount_total) > 0 ? `<tr><td style="color:#4f6b4a">Discount</td><td align="right">−${inr(Number(order.discount_total))}</td></tr>` : ""}
<tr><td style="padding-top:12px;font-weight:bold">Total</td><td align="right" style="font-weight:bold">${inr(Number(order.total))}</td></tr>
<tr><td colspan="2" style="font-size:12px;color:#6b625a">Includes ${inr(Number(order.tax_total))} GST</td></tr></table>
<p style="font-size:14px;line-height:1.6;margin-top:20px"><strong>Delivering to</strong><br>${escape([a?.first_name, a?.last_name].filter(Boolean).join(" "))}<br>${escape(a?.address_1 ?? "")}${a?.address_2 ? `, ${escape(a.address_2)}` : ""}<br>${escape(a?.city ?? "")}, ${escape(a?.province ?? "")} ${escape(a?.postal_code ?? "")}<br>${escape(a?.phone ?? "")}</p>
<p><a href="${storefrontUrl()}/order/${order.id}" style="color:#a46a34">View your order</a></p>`
      ),
    },
    logger
  )
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
