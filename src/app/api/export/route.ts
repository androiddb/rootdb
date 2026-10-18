import { createClient } from "@/lib/supabase/server";

/** Full account data export — profile, saves, authored content, interactions, submissions. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const uid = user.id;
  const [profile, saved, questions, answers, issues, votesIn, submissions] = await Promise.all([
    supabase.from("profiles").select("id,username,display_name,avatar_url,role,is_verified_dev,theme,analytics_opt_out,created_at").eq("id", uid).single(),
    supabase.from("saved_devices").select("device_id,created_at,last_seen_at").eq("user_id", uid),
    supabase.from("questions").select("*").eq("author_id", uid),
    supabase.from("answers").select("*").eq("author_id", uid),
    supabase.from("issues").select("*").eq("author_id", uid),
    supabase.from("votes").select("*").eq("user_id", uid),
    supabase.from("submissions").select("*").eq("user_id", uid),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    profile: profile.data,
    saved_devices: saved.data ?? [],
    questions: questions.data ?? [],
    answers: answers.data ?? [],
    issues: issues.data ?? [],
    votes: votesIn.data ?? [],
    submissions: submissions.data ?? [],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="rootdb-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
