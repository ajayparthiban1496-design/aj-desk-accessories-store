import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { emailSchema, type EmailInput } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

export function Newsletter({ className, dark }: { className?: string; dark?: boolean }) {
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState, reset } = useForm<EmailInput>({ resolver: zodResolver(emailSchema) });

  const onSubmit = async ({ email }: EmailInput) => {
    try {
      await api.subscribeNewsletter(email);
      setDone(true);
      reset();
      track("Newsletter signup");
      toast.success("You're in. Welcome to the studio letters.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (done)
    return (
      <p className={cn("flex items-center gap-2 text-sm", className)} role="status">
        <Check className="size-4 text-accent" /> Thanks — check your inbox for a welcome note.
      </p>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className} noValidate>
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <div
        className={cn(
          "flex h-13 items-center rounded-full border pl-5 pr-1.5 transition-colors focus-within:border-accent",
          dark ? "border-primary-foreground/20 bg-primary-foreground/5 dark:border-border dark:bg-background" : "border-border bg-surface",
        )}
      >
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!formState.errors.email}
          className={cn("h-full flex-1 bg-transparent text-[15px] outline-none", dark ? "placeholder:text-primary-foreground/40 dark:placeholder:text-muted" : "placeholder:text-muted/70")}
          {...register("email")}
        />
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="grid size-10 place-items-center rounded-full bg-accent text-accent-foreground transition-transform hover:scale-105 disabled:opacity-60"
          aria-label="Subscribe"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>
      {formState.errors.email && <p className="mt-2 pl-5 text-[13px] text-danger" role="alert">{formState.errors.email.message}</p>}
    </form>
  );
}
