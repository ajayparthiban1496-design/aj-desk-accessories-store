import * as A from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

export function Accordion({ items, defaultOpen }: { items: { id: string; title: string; content: ReactNode }[]; defaultOpen?: string }) {
  return (
    <A.Root type="single" collapsible defaultValue={defaultOpen} className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <A.Item key={item.id} value={item.id}>
          <A.Header className="font-sans text-base tracking-normal">
            <A.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left font-semibold transition-colors hover:text-accent">
              {item.title}
              <Plus className="size-4 shrink-0 transition-transform duration-300 group-data-[state=open]:rotate-45" aria-hidden />
            </A.Trigger>
          </A.Header>
          <A.Content className="overflow-hidden text-muted data-[state=closed]:animate-[accordion-up_200ms_ease-out] data-[state=open]:animate-[accordion-down_250ms_var(--ease-out-soft)]">
            <div className="pb-5 pr-8 leading-relaxed">{item.content}</div>
          </A.Content>
        </A.Item>
      ))}
    </A.Root>
  );
}
