import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { newPasswordSchema, type NewPasswordInput } from "@/lib/schemas";
import { usePageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { AuthShell } from "./AuthShell";

/** Landing page for the Supabase password-recovery link (also used from Account → Security). */
export default function ResetPassword() {
  usePageMeta({ title: "Choose a new password", description: "Set a new password for your account.", noindex: true });
  const auth = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NewPasswordInput>({ resolver: zodResolver(newPasswordSchema) });

  const onSubmit = async ({ password }: NewPasswordInput) => {
    try {
      await auth.updatePassword(password);
      toast.success("Password updated.");
      navigate("/account", { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Make it at least 8 characters — a short phrase works well.">
      {!auth.loading && !auth.user ? (
        <p className="rounded-[var(--radius-md)] bg-surface p-5 text-sm text-muted">This reset link has expired or was already used. Request a new one from the sign-in page.</p>
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
