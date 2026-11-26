import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { usePageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { AuthShell } from "./AuthShell";

export default function Login() {
  usePageMeta({ title: "Sign in", description: "Sign in to your Aj Desk account to track orders and manage your wishlist.", noindex: true });
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/account";
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

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

  return (
    <AuthShell title="Welcome back" subtitle={<>New here? <Link to="/signup" state={location.state} className="text-foreground underline underline-offset-4">Create an account</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Email" error={errors.email?.message}>{(p) => <Input {...p} type="email" autoComplete="email" {...register("email")} />}</Field>
        <Field label="Password" error={errors.password?.message}>{(p) => <Input {...p} type="password" autoComplete="current-password" {...register("password")} />}</Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Sign in</Button>
      </form>
    </AuthShell>
  );
}
