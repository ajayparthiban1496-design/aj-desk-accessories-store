import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { newPasswordSchema, type NewPasswordInput } from "@/lib/schemas";
import { usePageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { AuthShell } from "./AuthShell";

/** Landing page for the password-reset email: /reset-password?token=...&email=... */
export default function ResetPassword() {
  usePageMeta({ title: "Choose a new password", description: "Set a new password for your account.", noindex: true });
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NewPasswordInput>({ resolver: zodResolver(newPasswordSchema) });

  const onSubmit = async ({ password }: NewPasswordInput) => {
    try {
      await auth.resetPassword(token!, password);
      if (email) await auth.signIn(email, password);
      toast.success("Password updated.");
      navigate(email ? "/account" : "/login", { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Make it at least 8 characters — a short phrase works well.">
      {!token ? (
        <p className="rounded-[var(--radius-md)] bg-surface p-5 text-sm text-muted">
          This page needs the link from your reset email. <Link to="/forgot-password" className="text-foreground underline underline-offset-4">Request a new link</Link>.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Field label="New password" error={errors.password?.message}>{(p) => <Input {...p} type="password" autoComplete="new-password" {...register("password")} />}</Field>
          <Field label="Confirm password" error={errors.confirm?.message}>{(p) => <Input {...p} type="password" autoComplete="new-password" {...register("confirm")} />}</Field>
          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Update password</Button>
        </form>
      )}
    </AuthShell>
  );
}
