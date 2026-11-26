import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { signupSchema, type SignupInput } from "@/lib/schemas";
import { usePageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { AuthShell, GoogleIcon } from "./AuthShell";

export default function Signup() {
  usePageMeta({ title: "Create an account", description: "Create an Aj Desk account for faster checkout, order tracking and wishlists.", noindex: true });
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/account";
  const [confirmEmail, setConfirmEmail] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  if (auth.user && !confirmEmail) return <Navigate to={from} replace />;

  const onSubmit = async (v: SignupInput) => {
    try {
      const { needsConfirmation } = await auth.signUp(v.email, v.password, v.fullName);
      if (needsConfirmation) {
        setConfirmEmail(v.email);
        return;
      }
      toast.success("Account created — welcome to Aj Desk!");
      navigate(from, { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle={<>Already have one? <Link to="/login" state={location.state} className="text-foreground underline underline-offset-4">Sign in</Link></>}>
      {confirmEmail ? (
        <div className="rounded-[var(--radius-lg)] bg-surface p-6 text-center" role="status">
          <MailCheck className="mx-auto size-8 text-accent" />
          <p className="mt-3 font-semibold">Confirm your email</p>
          <p className="mt-1 text-sm text-muted">We sent a confirmation link to {confirmEmail}. Click it to activate your account.</p>
        </div>
      ) : (
        <>
          <Button variant="outline" className="w-full" onClick={() => auth.signInWithGoogle().catch((e: Error) => toast.error(e.message))}><GoogleIcon /> Sign up with Google</Button>
          <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-widest text-muted"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Field label="Full name" error={errors.fullName?.message}>{(p) => <Input {...p} autoComplete="name" {...register("fullName")} />}</Field>
            <Field label="Email" error={errors.email?.message}>{(p) => <Input {...p} type="email" autoComplete="email" {...register("email")} />}</Field>
            <Field label="Password" error={errors.password?.message} hint="At least 8 characters">{(p) => <Input {...p} type="password" autoComplete="new-password" {...register("password")} />}</Field>
            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Create account</Button>
            <p className="text-center text-xs text-muted">
              By signing up you agree to our <Link to="/terms" className="underline">terms</Link> and <Link to="/privacy" className="underline">privacy policy</Link>.
            </p>
          </form>
        </>
      )}
    </AuthShell>
  );
}
