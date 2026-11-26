import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: string;
  description?: string;
  side?: "right" | "left";
  children: ReactNode;
  footer?: ReactNode;
}

/** Slide-over panel built on Radix Dialog (focus trap, Esc to close, aria). */
export function Sheet({ open, onOpenChange, title, description, side = "right", children, footer }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_200ms_ease-out] data-[state=closed]:animate-[fade-out_150ms_ease-in]" />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 z-50 flex w-full max-w-md flex-col bg-background shadow-[var(--shadow-lift)] focus:outline-none",
            side === "right"
              ? "right-0 data-[state=open]:animate-[slide-in-right_300ms_var(--ease-out-soft)] data-[state=closed]:animate-[slide-out-right_200ms_ease-in]"
              : "left-0 data-[state=open]:animate-[slide-in-left_300ms_var(--ease-out-soft)] data-[state=closed]:animate-[slide-out-left_200ms_ease-in]",
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <div>
              <Dialog.Title className="font-display text-xl">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-sm text-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="grid size-10 place-items-center rounded-full transition-colors hover:bg-foreground/5" aria-label="Close">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="border-t border-border px-6 py-5">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
