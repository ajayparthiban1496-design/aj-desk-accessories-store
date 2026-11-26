// Stripe webhook: marks orders paid, decrements stock, sends confirmation email.
// Deploy with: supabase functions deploy stripe-webhook --no-verify-jwt
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const inr = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);

Deno.serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, Deno.env.get("STRIPE_WEBHOOK_SECRET")!, undefined, cryptoProvider);
  } catch (e) {
    console.error("Bad signature", e);
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (!orderId) return new Response("No order id", { status: 400 });

    // Idempotent: only transition pending → paid once.
    const { data: order } = await admin
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId)
      .eq("status", "pending")
      .select("id, order_number, email, total, access_token, shipping_address, order_items(product_name, variant_name, quantity, unit_price)")
      .maybeSingle();

    if (order) {
      await admin.rpc("decrement_stock", { p_order_id: order.id });
      await sendConfirmation(order).catch((e) => console.error("Email failed", e));
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.order_id) await admin.from("orders").update({ status: "cancelled" }).eq("id", session.metadata.order_id).eq("status", "pending");
  }

  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});

interface PaidOrder {
  id: string;
  order_number: string;
  email: string;
  total: number;
  access_token: string;
  shipping_address: { fullName: string };
  order_items: { product_name: string; variant_name: string; quantity: number; unit_price: number }[];
}

async function sendConfirmation(order: PaidOrder) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return;
  const site = Deno.env.get("SITE_URL") ?? "";
  const rows = order.order_items
    .map((i) => `<tr><td style="padding:8px 0">${i.product_name} — ${i.variant_name} × ${i.quantity}</td><td style="text-align:right">${inr(i.unit_price * i.quantity)}</td></tr>`)
    .join("");
  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#1c1815">
      <h1 style="font-weight:400">Thank you, ${order.shipping_address.fullName.split(" ")[0]}.</h1>
      <p style="font-family:Arial,sans-serif;color:#6b625a">Order #${order.order_number} is confirmed and will ship within 24 hours.</p>
      <table style="width:100%;font-family:Arial,sans-serif;font-size:14px;border-top:1px solid #e2dbd0">${rows}
        <tr><td style="padding-top:12px;font-weight:bold">Total</td><td style="text-align:right;font-weight:bold">${inr(order.total)}</td></tr>
      </table>
      <p style="font-family:Arial,sans-serif"><a href="${site}/order/${order.id}?t=${order.access_token}" style="color:#a46a34">View your order</a></p>
    </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("STORE_EMAIL_FROM") ?? "Aj Desk <orders@ajdesk.store>",
      to: order.email,
      subject: `Your Aj Desk order #${order.order_number}`,
      html,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}
