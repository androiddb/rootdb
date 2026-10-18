import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { ThemeVault } from "@/components/theme-toggle";
import { ProfileForm, AnalyticsToggle, ExportAccount, DangerZone } from "./settings-client";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const profile = data as Profile;

  const providers = (user!.app_metadata?.providers as string[] | undefined) ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <section className="panel p-5">
        <h2 className="mb-1 text-lg font-bold">Profile</h2>
        <p className="mb-4 text-sm muted">
          Signed in via {providers.length ? providers.join(", ") : "OAuth"}. Public username — visible on questions, answers and issues.
        </p>
        <ProfileForm username={profile.username} displayName={profile.display_name ?? ""} />
      </section>

      {/* Themes */}
      <section className="panel p-5">
        <h2 className="mb-1 text-lg font-bold">The vault</h2>
        <p className="mb-4 text-sm muted">
          30 themes — saved to your account, applied everywhere. The big toggle in the header stays Catppuccin Mocha ↔ Latte for speed.
        </p>
        <ThemeVault />
      </section>

      {/* Privacy */}
      <section className="panel p-5">
        <h2 className="mb-1 text-lg font-bold">Your data, your call</h2>
        <div className="space-y-4">
          <AnalyticsToggle initial={profile.analytics_opt_out} />
          <ExportAccount />
        </div>
      </section>

      {/* Danger */}
      <section className="rounded-md border p-5" style={{ borderColor: "color-mix(in srgb, var(--bad) 50%, transparent)" }}>
        <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--bad)" }}>Danger zone</h2>
        <DangerZone />
      </section>
    </div>
  );
}
