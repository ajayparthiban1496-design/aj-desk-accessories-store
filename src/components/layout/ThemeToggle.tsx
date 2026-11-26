import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#12100f" : "#F5F1EA");
  }, [dark]);

  const toggle = () => {
    setDark((d) => {
      localStorage.setItem("aj-theme", d ? "light" : "dark");
      return !d;
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn("grid size-10 place-items-center rounded-full hover:bg-foreground/5", className)}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
