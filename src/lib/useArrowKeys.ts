import type { KeyboardEvent } from "react";

/**
 * Keyboard support for ARIA tablists / button groups (roving focus).
 * ←/→ (and ↑/↓ when `vertical`) move to the previous/next item,
 * Home/End jump to the first/last. The new item is focused, scrolled into
 * view inside its horizontal scroller, and activated (clicked).
 */
export function arrowKeyHandler(options: { vertical?: boolean; selector?: string } = {}) {
  const { vertical = false, selector = '[role="tab"]' } = options;
  return (e: KeyboardEvent<HTMLElement>) => {
    const prevKeys = vertical ? ["ArrowLeft", "ArrowUp"] : ["ArrowLeft"];
    const nextKeys = vertical ? ["ArrowRight", "ArrowDown"] : ["ArrowRight"];
    if (![...prevKeys, ...nextKeys, "Home", "End"].includes(e.key)) return;

    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(selector)).filter((el) => !el.hasAttribute("disabled"));
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLElement);

    let next = current;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else if (prevKeys.includes(e.key)) next = current <= 0 ? items.length - 1 : current - 1;
    else next = current === -1 || current === items.length - 1 ? 0 : current + 1;

    e.preventDefault(); // stop the page from scrolling while moving between items
    const target = items[next];
    target.focus({ preventScroll: true });
    centerInScroller(target);
    target.click();
  };
}

/** Scrolls an item to the centre of its horizontally scrolling parent, without moving the page. */
export function centerInScroller(el: HTMLElement | null) {
  const scroller = el?.parentElement;
  if (!el || !scroller || scroller.scrollWidth <= scroller.clientWidth) return;
  const elBox = el.getBoundingClientRect();
  const box = scroller.getBoundingClientRect();
  scroller.scrollBy({ left: elBox.left - box.left - (box.width - elBox.width) / 2, behavior: "smooth" });
}
