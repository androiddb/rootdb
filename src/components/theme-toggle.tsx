"use client";

import { Moon, Sun, Palette, Check } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { THEMES, getTheme } from "@/lib/themes";

/** Anonymous quick switch between Catppuccin Mocha ↔ Latte. Vault lives in settings. */
export function QuickThemeToggle() {
  const { themeId, setQuickMode } = useTheme();
  const mode = getTheme(themeId).mode;
  return (
    <button
      className="btn btn-ghost btn-sm"
      title={mode === "dark" ? "Light theme (Catppuccin Latte)" : "Dark theme (Catppuccin Mocha)"}
      aria-label="Toggle color theme"
      onClick={() => setQuickMode(mode === "dark" ? "light" : "dark")}
    >
      {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

/** The vault — all 30 parody themes. Used on /settings. */
export function ThemeVault() {
  const { themeId, setTheme } = useTheme();
  const families = [...new Set(THEMES.map((x) => x.family))];
  return (
    <div className="space-y-6">
      {families.map((fam) => (
        <section key={fam}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide muted">{fam}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {THEMES.filter((x) => x.family === fam).map((th) => {
              const active = th.id === themeId;
              return (
                <button
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  className="panel card-hover relative overflow-hidden p-0 text-left"
                  aria-pressed={active}
                >
                  <div className="flex h-16">
                    <div style={{ background: th.vars.bg }} className="flex-1" />
                    <div style={{ background: th.vars.panel }} className="flex-1" />
                    <div style={{ background: th.vars.accent }} className="flex-1" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2" style={{ background: "var(--bg-alt)" }}>
                    <span className="text-xs font-semibold leading-tight">{th.label}</span>
                    {active && <Check size={14} className="ml-auto" style={{ color: "var(--accent)" }} />}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
