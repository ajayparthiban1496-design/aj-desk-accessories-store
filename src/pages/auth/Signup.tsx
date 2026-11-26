import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { signupSchema, type SignupInput } from "@/lib/schemas";
import { usePageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { AuthShell } from "./AuthShell";

export default function Signup() {
  usePageMeta({ title: "Create an account", description: "Create an Aj Desk account for faster checkout, order tracking and wishlists.", noindex: true });
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/account";
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  if (auth.user) return <Navigate to={from} replace />;

  const onSubmit = async (v: SignupInput) => {
    try {
      await auth.signUp(v.email, v.password, v.fullName);
      toast.success("Account created — welcome to Aj Desk!");
      navigate(from, { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle={<>Already have one? <Link to="/login" state={location.state} className="text-foreground underline underline-offset-4">Sign in</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Full name" error={errors.fullName?.message}>{(p) => <Input {...p} autoComplete="name" {...register("fullName")} />}</Field>
        <Field label="Email" error={errors.email?.message}>{(p) => <Input {...p} type="email" autoComplete="email" {...register("email")} />}</Field>
        <Field label="Password" error={errors.password?.message} hint="At least 8 characters">{(p) => <Input {...p} type="password" autoComplete="new-password" {...register("password")} />}</Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Create account</Button>
        <p className="text-center text-xs text-muted">
          By signing up you agree to our <Link to="/terms" className="underline">terms</Link> and <Link to="/privacy" className="underline">privacy policy</Link>.
        </p>
      </form>
    </AuthShell>
  );
}
