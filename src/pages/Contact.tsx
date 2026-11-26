import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Clock, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { contactSchema, type ContactInput } from "@/lib/schemas";
import { usePageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";

const topics = contactSchema.shape.topic.options;

export default function Contact() {
  usePageMeta({ title: "Contact us", description: "Questions about an order, a product or corporate gifting? Write to the Aj Desk team — we reply within one working day." });
  const [params] = useSearchParams();
  const [sent, setSent] = useState(false);
  const initialTopic = topics.find((t) => t === params.get("topic")) ?? "Order help";
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { topic: initialTopic },
  });

  const onSubmit = async (v: ContactInput) => {
    try {
      await api.sendContact(v);
      setSent(true);
      reset();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="container-page grid gap-14 pt-12 md:pt-16 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <p className="eyebrow">Contact</p>
        <h1 className="mt-3 text-5xl leading-tight md:text-6xl">We'd love to hear from you.</h1>
        <p className="mt-5 text-lg text-muted">Real people, based in Chennai. We reply to every message within one working day.</p>
        <ul className="mt-10 space-y-5">
          {[
            [Mail, "hello@ajdesk.store", "mailto:hello@ajdesk.store"],
            [Phone, "+91 44 4000 1234", "tel:+914440001234"],
            [Clock, "Mon–Sat, 10am–7pm IST", null],
            [MapPin, "Studio 4, Kotturpuram, Chennai 600085", null],
          ].map(([Icon, label, href]) => {
            const I = Icon as typeof Mail;
            return (
              <li key={label as string} className="flex items-center gap-4">
                <span className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent"><I className="size-5" aria-hidden /></span>
                {href ? <a href={href as string} className="hover:text-accent">{label as string}</a> : <span>{label as string}</span>}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="lg:col-span-6 lg:col-start-7">
        <div className="rounded-[var(--radius-xl)] bg-surface p-6 md:p-10">
          {sent ? (
            <div className="py-10 text-center" role="status">
              <CheckCircle2 className="mx-auto size-10 text-success" />
              <h2 className="mt-4 text-3xl">Message sent</h2>
              <p className="mt-2 text-muted">Thanks for writing in. We'll get back to you within one working day.</p>
              <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>Send another</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Name" error={errors.name?.message}>{(p) => <Input {...p} autoComplete="name" {...register("name")} />}</Field>
                <Field label="Email" error={errors.email?.message}>{(p) => <Input {...p} type="email" autoComplete="email" {...register("email")} />}</Field>
              </div>
              <Field label="Topic" error={errors.topic?.message}>
                {(p) => <Select {...p} {...register("topic")}>{topics.map((t) => <option key={t}>{t}</option>)}</Select>}
              </Field>
              <Field label="Message" error={errors.message?.message}>{(p) => <Textarea {...p} rows={6} {...register("message")} placeholder="Include your order number if it's about an order." />}</Field>
              <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Send message</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
