import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { usePageMeta } from "@/lib/seo";

type PageKey = "shipping" | "privacy" | "terms";

const pages: Record<PageKey, { title: string; description: string; updated: string; body: ReactNode }> = {
  shipping: {
    title: "Shipping & returns",
    description: "Delivery times, shipping charges, 30-day returns and refund timelines at Aj Desk.",
    updated: "1 November 2026",
    body: (
      <>
        <h2>Shipping</h2>
        <ul>
          <li>Free shipping on orders over ₹1,999. A flat ₹149 applies below that.</li>
          <li>Orders placed before 2pm IST on working days ship the same day from Chennai.</li>
          <li>Metro cities: 2–4 working days. Rest of India: 4–7 working days.</li>
          <li>You'll receive a tracking link by email and SMS as soon as your parcel ships.</li>
        </ul>
        <h2>Returns</h2>
        <p>
          Not quite right? Return any unused item in its original packaging within 30 days of delivery. Start a return by writing to{" "}
          <a href="mailto:hello@ajdesk.store">hello@ajdesk.store</a> with your order number — we'll schedule a free pickup.
        </p>
        <h2>Refunds</h2>
        <p>Refunds are issued to your original payment method within 2 working days of the item reaching us. Banks typically take 5–7 days to reflect it.</p>
        <h2>Damaged or faulty items</h2>
        <p>If something arrives damaged, send us a photo within 48 hours and we'll ship a replacement immediately — no need to wait for the return.</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy policy",
    description: "How Aj Desk collects, uses and protects your personal data.",
    updated: "1 November 2026",
    body: (
      <>
        <p>
          This policy explains what personal data Aj Desk Accessories ("we") collects when you use ajdesk.store, and how we use it. We comply with India's Digital Personal Data Protection Act, 2023.
        </p>
        <h2>What we collect</h2>
        <ul>
          <li>Account details: name, email and a securely hashed password.</li>
          <li>Order details: shipping address, phone number and order history.</li>
          <li>Payment: processed by our payment partner (Stripe). We never see or store your full card details.</li>
          <li>Usage: anonymous, cookieless analytics about which pages are visited.</li>
        </ul>
        <h2>How we use it</h2>
        <ul>
          <li>To process and deliver your orders and send order updates.</li>
          <li>To provide customer support.</li>
          <li>To send our newsletter, only if you've subscribed — unsubscribe any time.</li>
        </ul>
        <h2>Cookies</h2>
        <p>We use essential storage to keep you signed in and remember your bag. We do not use advertising cookies.</p>
        <h2>Your rights</h2>
        <p>
          You can access, correct or delete your data at any time by writing to <a href="mailto:privacy@ajdesk.store">privacy@ajdesk.store</a>. We respond within 30 days.
        </p>
        <h2>Data storage</h2>
        <p>Data is stored with our infrastructure provider (Supabase) with encryption at rest and strict access controls.</p>
      </>
    ),
  },
  terms: {
    title: "Terms of service",
    description: "The terms that apply when you shop with Aj Desk.",
    updated: "1 November 2026",
    body: (
      <>
        <p>By using ajdesk.store and placing an order, you agree to these terms.</p>
        <h2>Orders and pricing</h2>
        <p>All prices are in Indian Rupees and include GST. We reserve the right to cancel orders affected by pricing errors, in which case you'll receive a full refund.</p>
        <h2>Payment</h2>
        <p>Payments are processed securely by our payment partner. Your order is confirmed once payment succeeds.</p>
        <h2>Warranty</h2>
        <p>Products carry the warranty stated on their product page, covering manufacturing defects under normal use. Accidental damage and normal wear are not covered.</p>
        <h2>Returns</h2>
        <p>See our <Link to="/shipping-returns">shipping & returns policy</Link>.</p>
        <h2>Liability</h2>
        <p>To the extent permitted by law, our liability for any claim is limited to the amount you paid for the product concerned.</p>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of India, and courts in Chennai, Tamil Nadu have exclusive jurisdiction.</p>
        <h2>Contact</h2>
        <p>Questions? Write to <a href="mailto:hello@ajdesk.store">hello@ajdesk.store</a>.</p>
      </>
    ),
  },
};

export default function Legal({ page }: { page: PageKey }) {
  const p = pages[page];
  usePageMeta({ title: p.title, description: p.description });
  return (
    <article className="container-page pt-12 md:pt-16">
      <p className="eyebrow">Last updated {p.updated}</p>
      <h1 className="mt-3 text-5xl md:text-6xl">{p.title}</h1>
      <div className="prose-page mt-10">{p.body}</div>
    </article>
  );
}
