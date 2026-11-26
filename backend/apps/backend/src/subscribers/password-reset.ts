import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { emailLayout, sendEmail, storefrontUrl } from "../lib/email"

type PasswordResetData = { entity_id: string; token: string; actor_type: string }

/** Emails customers the link to choose a new password (storefront /reset-password). */
export default async function passwordResetHandler({ event: { data }, container }: SubscriberArgs<PasswordResetData>) {
  if (data.actor_type !== "customer") {
    return
  }
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = `${storefrontUrl()}/reset-password?token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(data.entity_id)}`
  await sendEmail(
    {
      to: data.entity_id,
      subject: "Reset your Aj Desk password",
      html: emailLayout(
        "Choose a new password",
        `<p style="line-height:1.6;color:#6b625a">Someone (hopefully you) asked to reset the password for this account. The link works once and expires soon.</p>
<p style="padding:16px 0"><a href="${link}" style="background:#2a211c;color:#f8f4ee;padding:14px 24px;border-radius:999px;text-decoration:none;font-weight:bold">Set a new password</a></p>
<p style="font-size:13px;color:#6b625a">If you didn't ask for this, you can ignore this email.</p>`
      ),
    },
    logger
  )
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
