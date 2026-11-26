import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Lock, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/store/cart";
import { useAuth } from "@/auth/AuthProvider";
import { addressSchema, STATES, type AddressInput } from "@/lib/schemas";
import { usePageMeta } from "@/lib/seo";
import { track } from "@/lib/analytics";
import { friendlyError } from "@/lib/medusa/sdk";
import { ensureIndianDestination, listDeliveryOptions, placeOrder, selectDeliveryOption } from "@/lib/medusa/checkout";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/misc";
import { ProductImage } from "@/components/ProductImage";
import { PromoCodeForm } from "@/components/CartLine";
import { OrderSummaryRows } from "./Cart";
import { cn, formatPrice } from "@/lib/utils";

const SAVED_ADDRESS = "aj_last_address";

export default function Checkout() {
  usePageMeta({ title: "Checkout", description: "Secure checkout.", noindex: true });
  const { user } = useAuth();
  const cart = useCart();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const submitting = useRef(false);
  // The option currently being added to the cart; Medusa locks the cart, so never send two at once.
  const selecting = useRef<string | null>(null);
  const [optionId, setOptionId] = useState<string>();

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

  // Delivery options for this cart, priced by Medusa (free-shipping rule included).
  const cartId = cart.cart?.id;
  const itemSignature = (cart.cart?.items ?? []).map((i) => `${i.id}:${i.quantity}`).join() + cart.promoCodes.join();
  const options = useQuery({
    queryKey: ["delivery-options", cartId, itemSignature],
    enabled: Boolean(cartId),
    queryFn: async () => {
      const withCountry = await ensureIndianDestination(cart.cart!);
      if (withCountry !== cart.cart) qc.setQueryData(["cart"], withCountry);
      return listDeliveryOptions(cartId!);
    },
  });

  // Default to the first (cheapest) option and add it to the cart so totals include shipping.
  useEffect(() => {
    const first = options.data?.[0];
    if (!cartId || !first) return;
    const current = cart.cart?.shipping_methods?.[0]?.shipping_option_id;
    const chosen = optionId && options.data?.some((o) => o.id === optionId) ? optionId : first.id;
    if (chosen !== optionId) setOptionId(chosen);
    if (current !== chosen && selecting.current !== chosen) {
      selecting.current = chosen;
      selectDeliveryOption(cartId, chosen)
        .then((next) => qc.setQueryData(["cart"], next))
        .catch((e) => toast.error(friendlyError(e, "We couldn't set the delivery option. Please refresh and try again.")))
        .finally(() => {
          if (selecting.current === chosen) selecting.current = null;
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.data, optionId, cartId]);

  const checkout = useMutation({
    mutationFn: (address: AddressInput) => placeOrder(cartId!, address, optionId!),
    onSuccess: (order, address) => {
      localStorage.setItem(SAVED_ADDRESS, JSON.stringify({ ...address, email: address.email }));
      track("Checkout", { value: Math.round(Number(order.total ?? 0)) });
      cart.reset();
      void qc.invalidateQueries({ queryKey: ["products"] });
      navigate(`/order/${order.id}`, { replace: true, state: { order } });
    },
    onError: (e) => {
      toast.error(friendlyError(e, "We couldn't place your order. Please check your bag and try again."));
      cart.refetch();
    },
    onSettled: () => {
      submitting.current = false;
    },
  });

  const onSubmit = (values: AddressInput) => {
    // Guard against double clicks / double Enter before React re-renders.
    if (submitting.current || !cartId || !optionId) return;
    submitting.current = true;
    checkout.mutate(values);
  };

  if (!cart.canOrder)
    return (
      <div className="container-page py-16">
        <ErrorState message="Ordering is paused while we reconnect to the shop. Your bag is safe — please try again in a few minutes." onRetry={() => window.location.reload()} />
      </div>
    );

  if (!cart.isLoading && cart.lines.length === 0 && !checkout.isSuccess)
    return (
      <div className="container-page py-16">
        <EmptyState icon={<ShoppingBag />} title="Nothing to check out yet" body="Your bag is empty." action={<Button asChild><Link to="/shop">Shop the collection</Link></Button>} />
      </div>
    );

  const placing = checkout.isPending;
  const shippingKnown = (cart.cart?.shipping_methods ?? []).length > 0;
  const ready = Boolean(optionId) && shippingKnown && !cart.isUpdating;

  return (
    <div className="container-page pt-10 md:pt-14">
      <h1 className="text-4xl md:text-5xl">Checkout</h1>
      {!user && (
        <p className="mt-3 text-muted">
          Have an account? <Link to="/login" state={{ from: "/checkout" }} className="text-foreground underline underline-offset-4">Sign in</Link> to see this order in your account.
        </p>
      )}
      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-10 lg:col-span-7" noValidate aria-busy={placing}>
          <fieldset disabled={placing} className="space-y-10">
            <section aria-labelledby="contact-h" className="space-y-5">
              <h2 id="contact-h" className="text-2xl">Contact</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Email" error={errors.email?.message} hint="For your order confirmation">{(p) => <Input {...p} type="email" autoComplete="email" {...register("email")} />}</Field>
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
            <section aria-labelledby="delivery-h" className="space-y-3">
              <h2 id="delivery-h" className="text-2xl">Delivery</h2>
              {options.isLoading ? (
                <Skeleton className="h-16" />
              ) : options.isError ? (
                <ErrorState message="We couldn't load delivery options." onRetry={() => options.refetch()} />
              ) : !options.data?.length ? (
                <p className="rounded-[var(--radius-md)] border border-border bg-surface p-5 text-sm text-muted">No delivery option is available for this bag yet. Please contact us and we'll sort it out.</p>
              ) : (
                <div className="space-y-2" role="radiogroup" aria-label="Delivery option">
                  {options.data.map((o) => (
                    <label key={o.id} className={cn("flex cursor-pointer items-center gap-4 rounded-[var(--radius-md)] border bg-surface p-4 transition-colors", optionId === o.id ? "border-foreground" : "border-border hover:border-foreground/30")}>
                      <input type="radio" name="delivery" className="size-4 accent-[var(--accent)]" checked={optionId === o.id} onChange={() => setOptionId(o.id)} />
                      <Truck className="size-5 text-accent" aria-hidden />
                      <span className="flex-1">
                        <span className="block font-semibold">{o.name}</span>
                        {o.description && <span className="block text-sm text-muted">{o.description}</span>}
                      </span>
                      <span className="font-semibold">{o.amount === 0 ? <span className="text-success">Free</span> : formatPrice(o.amount)}</span>
                    </label>
                  ))}
                </div>
              )}
            </section>
            <section aria-labelledby="pay-h" className="space-y-3">
              <h2 id="pay-h" className="text-2xl">Payment</h2>
              <div className="flex items-start gap-4 rounded-[var(--radius-md)] border border-foreground bg-surface p-4">
                <Banknote className="mt-0.5 size-5 text-accent" aria-hidden />
                <div>
                  <p className="font-semibold">Pay on delivery</p>
                  <p className="text-sm text-muted">Pay by cash or UPI when your order arrives. We'll call to confirm before dispatch.</p>
                </div>
              </div>
            </section>
          </fieldset>
          <Button type="submit" size="lg" className="w-full lg:hidden" loading={placing} disabled={!ready}>
            <Lock /> Place order · {formatPrice(cart.totals.total)}
          </Button>
        </form>

        <aside className="lg:col-span-5" aria-label="Order summary">
          <div className="space-y-6 rounded-[var(--radius-lg)] bg-surface p-6 lg:sticky lg:top-28">
            <h2 className="text-2xl">Order summary</h2>
            {cart.isLoading ? (
              <Skeleton className="h-40" />
            ) : (
              <ul className="space-y-4">
                {cart.lines.map((l) => (
                  <li key={l.id} className="flex items-center gap-4">
                    <div className="relative">
                      <ProductImage src={(l.product?.images[0] ?? l.thumbnail).replace(/w=\d+/, "w=200")} alt="" className="size-16 rounded-[var(--radius-md)]" />
                      <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{l.quantity}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{l.title}</p>
                      <p className="text-xs text-muted">{l.variantTitle}</p>
                    </div>
                    <p className="text-sm">{formatPrice(l.total)}</p>
                  </li>
                ))}
              </ul>
            )}
            <PromoCodeForm />
            <OrderSummaryRows totals={cart.totals} shippingKnown={shippingKnown} />
            <Button type="submit" form="checkout-form" size="lg" className="hidden w-full lg:flex" loading={placing} disabled={!ready}>
              <Lock /> Place order
            </Button>
            <p className="text-center text-xs text-muted">
              By placing your order you agree to our <Link to="/terms" className="underline">terms</Link> and <Link to="/privacy" className="underline">privacy policy</Link>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
