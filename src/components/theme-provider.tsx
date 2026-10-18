"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { applyThemeVars, DEFAULT_DARK, DEFAULT_LIGHT, getTheme, THEME_COOKIE, THEME_MODE_COOKIE } from "@/lib/themes-dom";
import { getTheme as getThemeDef } from "@/lib/themes";

interface ThemeCtx {
  themeId: string;
  setTheme: (id: string) => void;
  setQuickMode: (mode: "dark" | "light") => void;
}
const Ctx = createContext<ThemeCtx>({ themeId: DEFAULT_DARK, setTheme: () => {}, setQuickMode: () => {} });

function readCookie(name: string): string {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : "";
}

export function ThemeProvider({
  children,
  initialTheme,
  profileTheme,
  onPersistProfile,
}: {
  children: React.ReactNode;
  /** Cookie theme resolved on the server (pre-FOUC script already applied it). */
  initialTheme: string;
  /** Signed-in profile theme — wins over the anonymous cookie. */
  profileTheme?: string | null;
  /** Persist to profiles.theme when signed in (server action, fire-and-forget). */
  onPersistProfile?: (id: string) => void;
}) {
  const [themeId, setThemeId] = useState(profileTheme || initialTheme || DEFAULT_DARK);

  useEffect(() => {
    if (profileTheme && profileTheme !== themeId) setThemeId(profileTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileTheme]);

  useEffect(() => {
    applyThemeVars(themeId);
  }, [themeId]);

  const setTheme = useCallback(
    (id: string) => {
      setThemeId(id);
      const days = 365 * 24 * 60 * 60;
      document.cookie = `${THEME_COOKIE}=${encodeURIComponent(id)};path=/;max-age=${days};samesite=lax`;
      onPersistProfile?.(id);
    },
    [onPersistProfile],
  );

  const setQuickMode = useCallback(
    (mode: "dark" | "light") => {
      const id = mode === "light" ? DEFAULT_LIGHT : DEFAULT_DARK;
      const days = 365 * 24 * 60 * 60;
      document.cookie = `${THEME_MODE_COOKIE}=${mode};path=/;max-age=${days};samesite=lax`;
      // Anonymous quick switch: clear the explicit theme so the mode default applies.
      document.cookie = `${THEME_COOKIE}=;path=/;max-age=0`;
      setThemeId(id);
    },
    [],
  );

  const value = useMemo(() => ({ themeId, setTheme, setQuickMode }), [themeId, setTheme, setQuickMode]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
export { getThemeDef as getTheme };
