import { Logger } from "@medusajs/framework/types"

type Email = { to: string; subject: string; html: string }

/**
 * Sends a transactional email through Resend's HTTP API when RESEND_API_KEY
 * is set. Without it the email is skipped and a warning is logged, so the
 * shop keeps working before an email provider is connected.
 */
export async function sendEmail(email: Email, logger: Logger) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    logger.warn(`Email not sent (RESEND_API_KEY is not set): "${email.subject}"`)
    return
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.STORE_EMAIL_FROM || "Aj Desk <onboarding@resend.dev>",
      to: email.to,
      subject: email.subject,
      html: email.html,
    }),
  })
  if (!res.ok) {
    logger.error(`Email "${email.subject}" failed: ${res.status} ${await res.text()}`)
  }
}

export const storefrontUrl = () => (process.env.STOREFRONT_URL || "http://localhost:5173").replace(/\/$/, "")

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

/** Plain, mobile-friendly layout in the storefront's colours. */
export function emailLayout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5f1ea;font-family:Arial,Helvetica,sans-serif;color:#1c1815">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#fbf9f5;border-radius:16px;padding:32px">
<tr><td style="font-family:Georgia,serif;font-size:26px;font-style:italic">Aj <span style="font-family:Arial;font-style:normal;font-size:12px;letter-spacing:4px;color:#6b625a">DESK</span></td></tr>
<tr><td style="padding-top:24px"><h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;margin:0 0 12px">${escape(title)}</h1>${body}</td></tr>
<tr><td style="padding-top:32px;font-size:12px;color:#6b625a">Aj Desk Accessories · Chennai, India</td></tr>
</table></td></tr></table></body></html>`
}

export { escape }
