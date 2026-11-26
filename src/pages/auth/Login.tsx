import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { usePageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { AuthShell, GoogleIcon } from "./AuthShell";

export default function Login() {
  usePageMeta({ title: "Sign in", description: "Sign in to your Aj Desk account to track orders and manage your wishlist.", noindex: true });
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/account";
  const [magicSent, setMagicSent] = useState(false);
  const { register, handleSubmit, getValues, trigger, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  if (auth.user) return <Navigate to={from} replace />;

  const onSubmit = async (v: LoginInput) => {
    try {
      await auth.signIn(v.email, v.password);
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const magic = async () => {
    if (!(await trigger("email"))) return;
    try {
      await auth.signInWithMagicLink(getValues("email"));
      setMagicSent(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const google = async () => {
    try {
      await auth.signInWithGoogle();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle={<>New here? <Link to="/signup" state={location.state} className="text-foreground underline underline-offset-4">Create an account</Link></>}>
      {magicSent ? (
        <div className="rounded-[var(--radius-lg)] bg-surface p-6 text-center" role="status">
          <Mail className="mx-auto size-8 text-accent" />
          <p className="mt-3 font-semibold">Check your inbox</p>
          <p className="mt-1 text-sm text-muted">We sent a sign-in link to {getValues("email")}.</p>
        </div>
      ) : (
        <>
          <Button variant="outline" className="w-full" onClick={google}><GoogleIcon /> Continue with Google</Button>
          <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-widest text-muted"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Field label="Email" error={errors.email?.message}>{(p) => <Input {...p} type="email" autoComplete="email" {...register("email")} />}</Field>
            <Field label="Password" error={errors.password?.message}>{(p) => <Input {...p} type="password" autoComplete="current-password" {...register("password")} />}</Field>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Sign in</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={magic}><Mail /> Email me a sign-in link instead</Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
