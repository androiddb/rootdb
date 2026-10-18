import { getTheme, THEME_COOKIE, THEME_MODE_COOKIE, DEFAULT_DARK, DEFAULT_LIGHT } from "@/lib/themes";

export { THEME_COOKIE, THEME_MODE_COOKIE, DEFAULT_DARK, DEFAULT_LIGHT, getTheme };

export function applyThemeVars(id: string) {
  const def = getTheme(id);
  const el = document.documentElement;
  el.setAttribute("data-theme", def.id);
  for (const [k, v] of Object.entries(def.vars)) el.style.setProperty(`--${k}`, v as string);
  el.style.colorScheme = def.mode;
}
