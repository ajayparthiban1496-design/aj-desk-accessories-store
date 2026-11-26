import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { emailSchema, type EmailInput } from "@/lib/schemas";
import { usePageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { AuthShell } from "./AuthShell";

export default function ForgotPassword() {
  usePageMeta({ title: "Reset your password", description: "Get a link to reset your Aj Desk password.", noindex: true });
  const auth = useAuth();
  const [sent, setSent] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmailInput>({ resolver: zodResolver(emailSchema) });

  const onSubmit = async ({ email }: EmailInput) => {
    try {
      await auth.sendPasswordReset(email);
      setSent(email);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send you a link to choose a new one.">
      {sent ? (
        <div className="rounded-[var(--radius-lg)] bg-surface p-6 text-center" role="status">
          <MailCheck className="mx-auto size-8 text-accent" />
          <p className="mt-3 font-semibold">Check your inbox</p>
          <p className="mt-1 text-sm text-muted">If an account exists for {sent}, a reset link is on its way.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Field label="Email" error={errors.email?.message}>{(p) => <Input {...p} type="email" autoComplete="email" {...register("email")} />}</Field>
          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Send reset link</Button>
        </form>
      )}
      <Link to="/login" className="mt-6 inline-block text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">← Back to sign in</Link>
    </AuthShell>
  );
}
