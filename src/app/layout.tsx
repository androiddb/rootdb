import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "sonner";
import { themeInitScript, THEME_COOKIE } from "@/lib/themes";
import { createClient } from "@/lib/supabase/server";
import { saveThemeToProfile } from "@/lib/actions";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = {
  title: { default: "RootDB — the phone modding index", template: "%s · RootDB" },
  description:
    "Search an Android phone and get its rootability verdict: bootloader status, root methods, ROMs, recoveries, modules, Q&A and known issues — per device variant. Replace XDA, not make another XDA.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get(THEME_COOKIE)?.value;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = (data as Profile) ?? null;
  }

  const analyticsOn = !profile?.analytics_opt_out;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body>
        <ThemeProvider
          initialTheme={profile?.theme ?? cookieTheme ?? "catppuccin-mocha"}
          profileTheme={profile?.theme}
          onPersistProfile={user ? (id) => void saveThemeToProfile(id) : undefined}
        >
          <div className="flex min-h-screen flex-col">
            <SiteHeader user={user ? { id: user.id, email: user.email ?? undefined } : null} profile={profile} />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </ThemeProvider>
        <Toaster theme="dark" toastOptions={{ style: { background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" } }} />
        {analyticsOn && <Analytics />}
      </body>
    </html>
  );
}
