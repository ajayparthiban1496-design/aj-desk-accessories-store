// Creates a pending order from the cart and returns a Stripe Checkout URL.
// Prices and stock are read from the database — the client only sends
// product/variant ids and quantities, so prices can't be tampered with.
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";
import { z } from "npm:zod@3";
import { corsHeaders, json } from "../_shared/cors.ts";

const FREE_SHIPPING_THRESHOLD = 199900;
const FLAT_SHIPPING = 14900;

const Body = z.object({
  items: z.array(z.object({ productId: z.string().uuid(), variantId: z.string().uuid(), quantity: z.number().int().min(1).max(10) })).min(1).max(30),
  address: z.object({
    fullName: z.string().trim().min(2).max(80),
    email: z.string().trim().email(),
    phone: z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/),
    line1: z.string().trim().min(4).max(120),
    line2: z.string().trim().max(120).optional(),
    city: z.string().trim().min(2).max(60),
    state: z.string().trim().min(2).max(60),
    pincode: z.string().trim().regex(/^[1-9]\d{5}$/),
  }),
  origin: z.string().url().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Please check your details and try again." }, 400);
    const { items, address } = parsed.data;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Identify the signed-in user (optional — guests can check out).
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const { data } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data.user?.id ?? null;
    }

    const { data: variants, error: vErr } = await admin
      .from("product_variants")
      .select("id, name, stock, product_id, products!inner(id, name, price, images, is_active)")
      .in("id", items.map((i) => i.variantId));
    if (vErr) throw vErr;

    type Row = { id: string; name: string; stock: number; product_id: string; products: { id: string; name: string; price: number; images: string[]; is_active: boolean } };
    const lines = items.map((item) => {
      const v = (variants as unknown as Row[]).find((x) => x.id === item.variantId && x.product_id === item.productId);
      if (!v || !v.products.is_active) throw new UserError("An item in your bag is no longer available.");
      if (v.stock < item.quantity) throw new UserError(`Only ${v.stock} left of ${v.products.name} (${v.name}).`);
      return { v, quantity: item.quantity };
    });

    const subtotal = lines.reduce((s, l) => s + l.v.products.price * l.quantity, 0);
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;

    const { data: order, error: oErr } = await admin
      .from("orders")
      .insert({ user_id: userId, email: address.email, subtotal, shipping, total: subtotal + shipping, shipping_address: address })
      .select("id, order_number, access_token")
      .single();
    if (oErr) throw oErr;

    const { error: iErr } = await admin.from("order_items").insert(
      lines.map((l) => ({
        order_id: order.id, product_id: l.v.products.id, variant_id: l.v.id, product_name: l.v.products.name,
        variant_name: l.v.name, image: l.v.products.images[0] ?? "", unit_price: l.v.products.price, quantity: l.quantity,
      })),
    );
    if (iErr) throw iErr;

    const site = Deno.env.get("SITE_URL") ?? parsed.data.origin ?? "http://localhost:5173";
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: address.email,
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      line_items: [
        ...lines.map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: "inr",
            unit_amount: l.v.products.price,
            product_data: { name: `${l.v.products.name} — ${l.v.name}`, images: l.v.products.images.slice(0, 1) },
          },
        })),
        ...(shipping ? [{ quantity: 1, price_data: { currency: "inr", unit_amount: shipping, product_data: { name: "Shipping" } } }] : []),
      ],
      success_url: `${site}/order/${order.id}?t=${order.access_token}&paid=1`,
      cancel_url: `${site}/checkout`,
    });

    await admin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
    return json({ url: session.url, orderId: order.id });
  } catch (e) {
    if (e instanceof UserError) return json({ error: e.message }, 400);
    console.error(e);
    return json({ error: "We couldn't start checkout. Please try again." }, 500);
  }
});

class UserError extends Error {}
