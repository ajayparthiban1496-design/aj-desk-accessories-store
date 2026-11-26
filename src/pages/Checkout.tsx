import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Lock, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/store/cart";
import { useCartDetails } from "@/store/useCartDetails";
import { useAuth } from "@/auth/AuthProvider";
import { api } from "@/lib/api";
import { addressSchema, STATES, type AddressInput } from "@/lib/schemas";
import { usePageMeta } from "@/lib/seo";
import { isDemoMode } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { ProductImage } from "@/components/ProductImage";
import { OrderSummaryRows } from "./Cart";
import { formatPrice } from "@/lib/utils";

const SAVED_ADDRESS = "aj-last-address";

export default function Checkout() {
  usePageMeta({ title: "Checkout", description: "Secure checkout.", noindex: true });
  const { user } = useAuth();
  const cart = useCart();
  const { lines, subtotal, shipping, total, isLoading } = useCartDetails();
  const navigate = useNavigate();

  const form = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: (() => {
      try {
        return JSON.parse(localStorage.getItem(SAVED_ADDRESS) ?? "{}") as Partial<AddressInput>;
      } catch {
        return {};
      }
    })(),
  });
  const { register, handleSubmit, formState: { errors } } = form;

  useEffect(() => {
    if (user && !form.getValues("email")) form.setValue("email", user.email);
    if (user?.fullName && !form.getValues("fullName")) form.setValue("fullName", user.fullName);
  }, [user, form]);

  const checkout = useMutation({
    mutationFn: (address: AddressInput) => api.createCheckout(cart.items, address, user),
    onSuccess: (res, address) => {
      localStorage.setItem(SAVED_ADDRESS, JSON.stringify(address));
      track("Checkout", { value: Math.round(total / 100) });
      if (res.redirectUrl) {
        window.location.assign(res.redirectUrl);
        return;
      }
      cart.clear();
      navigate(`/order/${res.orderId}`, { replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isLoading && lines.length === 0 && !checkout.isSuccess)
    return (
      <div className="container-page py-16">
        <EmptyState icon={<ShoppingBag />} title="Nothing to check out yet" body="Your bag is empty." action={<Button asChild><Link to="/shop">Shop the collection</Link></Button>} />
      </div>
    );

  return (
    <div className="container-page pt-10 md:pt-14">
      <h1 className="text-4xl md:text-5xl">Checkout</h1>
      {!user && (
        <p className="mt-3 text-muted">
          Have an account? <Link to="/login" state={{ from: "/checkout" }} className="text-foreground underline underline-offset-4">Sign in</Link> for faster checkout and order tracking.
        </p>
      )}
      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <form id="checkout-form" onSubmit={handleSubmit((v) => checkout.mutate(v))} className="space-y-10 lg:col-span-7" noValidate>
          <section aria-labelledby="contact-h" className="space-y-5">
            <h2 id="contact-h" className="text-2xl">Contact</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Email" error={errors.email?.message}>{(p) => <Input {...p} type="email" autoComplete="email" {...register("email")} />}</Field>
              <Field label="Mobile number" error={errors.phone?.message} hint="For delivery updates only">{(p) => <Input {...p} type="tel" autoComplete="tel" inputMode="tel" placeholder="98765 43210" {...register("phone")} />}</Field>
            </div>
          </section>
          <section aria-labelledby="ship-h" className="space-y-5">
            <h2 id="ship-h" className="text-2xl">Shipping address</h2>
            <Field label="Full name" error={errors.fullName?.message}>{(p) => <Input {...p} autoComplete="name" {...register("fullName")} />}</Field>
            <Field label="Address" error={errors.line1?.message}>{(p) => <Input {...p} autoComplete="address-line1" placeholder="House number and street" {...register("line1")} />}</Field>
            <Field label="Apartment, landmark" optional error={errors.line2?.message}>{(p) => <Input {...p} autoComplete="address-line2" {...register("line2")} />}</Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="City" error={errors.city?.message}>{(p) => <Input {...p} autoComplete="address-level2" {...register("city")} />}</Field>
              <Field label="State" error={errors.state?.message}>
                {(p) => (
                  <Select {...p} autoComplete="address-level1" defaultValue="" {...register("state")}>
                    <option value="" disabled>Select</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="PIN code" error={errors.pincode?.message}>{(p) => <Input {...p} autoComplete="postal-code" inputMode="numeric" maxLength={6} {...register("pincode")} />}</Field>
            </div>
          </section>
          <section aria-labelledby="pay-h" className="space-y-3">
            <h2 id="pay-h" className="text-2xl">Payment</h2>
            <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 text-sm text-muted">
              {isDemoMode
                ? "Demo mode: no payment is taken. Placing the order creates a sample order stored in this browser."
                : "You'll be redirected to our secure payment partner (Stripe) to pay by card, UPI or net banking."}
            </div>
          </section>
          <Button type="submit" size="lg" className="w-full lg:hidden" loading={checkout.isPending}>
            <Lock /> {isDemoMode ? "Place order" : "Continue to payment"} · {formatPrice(total)}
          </Button>
        </form>

        <aside className="lg:col-span-5" aria-label="Order summary">
          <div className="rounded-[var(--radius-lg)] bg-surface p-6 lg:sticky lg:top-28">
            <h2 className="mb-6 text-2xl">Order summary</h2>
            {isLoading ? (
              <Skeleton className="h-40" />
            ) : (
              <ul className="mb-6 space-y-4">
                {lines.map((l) => (
                  <li key={l.variantId} className="flex items-center gap-4">
                    <div className="relative">
                      <ProductImage src={l.product.images[0].replace(/w=\d+/, "w=200")} alt="" className="size-16 rounded-[var(--radius-md)]" />
                      <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{l.quantity}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{l.product.name}</p>
                      <p className="text-xs text-muted">{l.variant.name}</p>
                    </div>
                    <p className="text-sm">{formatPrice(l.lineTotal)}</p>
                  </li>
                ))}
              </ul>
            )}
            <OrderSummaryRows subtotal={subtotal} shipping={shipping} total={total} />
            <Button type="submit" form="checkout-form" size="lg" className="mt-6 hidden w-full lg:flex" loading={checkout.isPending}>
              <Lock /> {isDemoMode ? "Place order" : "Continue to payment"}
            </Button>
            <p className="mt-4 text-center text-xs text-muted">
              By placing your order you agree to our <Link to="/terms" className="underline">terms</Link> and <Link to="/privacy" className="underline">privacy policy</Link>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
