"use client";

import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "@/components/ui/site-icons";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      className="site-theme-toggle"
      data-theme-toggle=""
      title="Switch between light and dark theme"
      aria-label="Switch between light and dark theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* CSS follows the pre-hydration theme, so the visible icon never flashes. */}
      <MoonIcon />
      <SunIcon />
    </button>
  );
}
