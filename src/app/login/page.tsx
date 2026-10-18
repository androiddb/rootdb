"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Terminal } from "lucide-react";
import { GithubMark, GoogleMark, AppleMark } from "@/components/brand-icons";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

function LoginInner() {
  const search = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const oauthError = search.get("error");

  async function signIn(provider: "github" | "google" | "apple") {
    setError(null);
    setLoading(provider);
    const supabase = createClient();
    const next = search.get("next") ?? "/";
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <span className="mb-4 grid size-14 place-items-center rounded-xl" style={{ background: "var(--accent)", color: "var(--on-accent)" }}>
        <Terminal size={26} strokeWidth={2.5} />
      </span>
      <h1 className="text-2xl font-bold">Sign in to RootDB</h1>
      <p className="mt-2 text-center text-sm muted">
        Vote, confirm what works, save devices, ask questions, report issues and contribute to the index.
        OAuth only — no passwords to sniff on a rooted browser.
      </p>

      {(error || oauthError) && (
        <div className="mt-5 w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--bad)", color: "var(--bad)" }}>
          {error ?? oauthError}
        </div>
      )}

      <div className="mt-7 flex w-full flex-col gap-3">
        <button className="btn w-full" disabled={!!loading} onClick={() => signIn("github")}>
          <GithubMark /> {loading === "github" ? "Opening GitHub…" : "Continue with GitHub"}
        </button>
        <button className="btn w-full" disabled={!!loading} onClick={() => signIn("google")}>
          <GoogleMark /> {loading === "google" ? "Opening Google…" : "Continue with Google"}
        </button>
        <button className="btn w-full" disabled={!!loading} onClick={() => signIn("apple")}>
          <AppleMark /> {loading === "apple" ? "Opening Apple…" : "Continue with Apple"}
        </button>
      </div>

      <p className="mt-6 text-center text-xs muted">
        By signing in you agree to the <a className="underline" href="/legal/terms">Terms</a> and{" "}
        <a className="underline" href="/legal/privacy">Privacy Policy</a>.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
