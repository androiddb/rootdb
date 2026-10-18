"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { THEME_IDS } from "@/lib/themes";
import type { QuestionStatus, IssueStatus, SubmissionType } from "@/lib/types";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const err = (e: unknown): ActionResult => ({
  ok: false,
  error: e instanceof Error ? e.message : "Something went wrong",
});

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null } as const;
  return { supabase, user } as const;
}

async function isMod(supabase: Awaited<ReturnType<typeof createClient>>, uid: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", uid).single();
  return data?.role === "moderator" || data?.role === "admin";
}

// ---------- profile / prefs ----------

export async function saveThemeToProfile(themeId: string): Promise<ActionResult> {
  try {
    if (!THEME_IDS.has(themeId)) return { ok: false, error: "Unknown theme" };
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false, error: "Not signed in" };
    const { error } = await supabase.from("profiles").update({ theme: themeId }).eq("id", user.id);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function updateProfile(input: { username?: string; display_name?: string }): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false, error: "Not signed in" };
    const patch: Record<string, string> = {};
    if (input.username) {
      if (!/^[a-z0-9_]{3,24}$/.test(input.username)) return { ok: false, error: "Username: 3-24 chars, lowercase letters, digits, underscores" };
      patch.username = input.username;
    }
    if (input.display_name !== undefined) patch.display_name = input.display_name.slice(0, 80);
    if (!Object.keys(patch).length) return { ok: false, error: "Nothing to update" };
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (error) throw error.code === "23505" ? new Error("Username taken") : error;
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function setAnalyticsOptOut(optOut: boolean): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false, error: "Not signed in" };
    const { error } = await supabase.from("profiles").update({ analytics_opt_out: optOut }).eq("id", user.id);
    if (error) throw error;
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function deleteAccount(): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false, error: "Not signed in" };
    const { error } = await supabase.rpc("delete_my_account");
    if (error) throw error;
    await supabase.auth.signOut();
  } catch (e) {
    return err(e);
  }
  redirect("/");
}

// ---------- saved devices ----------

export async function toggleSave(deviceId: string, deviceHref: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false, error: "Sign in to save devices" };
    const { data: existing } = await supabase.from("saved_devices").select("device_id").eq("device_id", deviceId).eq("user_id", user.id).maybeSingle();
    if (existing) {
      const { error } = await supabase.from("saved_devices").delete().eq("device_id", deviceId).eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("saved_devices").insert({ device_id: deviceId, user_id: user.id });
      if (error) throw error;
    }
    revalidatePath(deviceHref);
    revalidatePath("/saved");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

// ---------- votes & confirmations ----------

export async function castVote(targetType: "question" | "answer" | "issue", targetId: string, path: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false, error: "Sign in to vote" };
    const { data: existing } = await supabase.from("votes").select("target_id").eq("target_type", targetType).eq("target_id", targetId).eq("user_id", user.id).maybeSingle();
    if (existing) {
      const { error } = await supabase.from("votes").delete().eq("target_type", targetType).eq("target_id", targetId).eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("votes").insert({ target_type: targetType, target_id: targetId, user_id: user.id });
      if (error) throw error;
    }
    revalidatePath(path);
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function confirmWorks(targetType: "rom" | "root_method" | "software", targetId: string, path: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false, error: "Sign in to confirm" };
    const { data: existing } = await supabase.from("confirmations").select("target_id").eq("target_type", targetType).eq("target_id", targetId).eq("user_id", user.id).maybeSingle();
    if (existing) {
      const { error } = await supabase.from("confirmations").delete().eq("target_type", targetType).eq("target_id", targetId).eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("confirmations").insert({ target_type: targetType, target_id: targetId, user_id: user.id });
      if (error) throw error;
    }
    revalidatePath(path);
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

// ---------- questions / answers / issues ----------

export async function askQuestion(input: { deviceId: string; title: string; body?: string; scope?: { romId?: string; rootMethodId?: string; variantId?: string } }, path: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false, error: "Sign in to ask a question" };
    if (input.title.trim().length < 6) return { ok: false, error: "Title needs at least 6 characters" };
    const { error, data } = await supabase
      .from("questions")
      .insert({
        device_id: input.deviceId,
        author_id: user.id,
        title: input.title.trim().slice(0, 200),
        body_md: input.body?.slice(0, 8000) ?? null,
        rom_id: input.scope?.romId ?? null,
        root_method_id: input.scope?.rootMethodId ?? null,
        variant_id: input.scope?.variantId ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath(path);
    return { ok: true, id: data?.id };
  } catch (e) {
    return err(e);
  }
}

export async function addAnswer(input: { questionId: string; body: string }, path: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false, error: "Sign in to answer" };
    if (input.body.trim().length < 4) return { ok: false, error: "Answer is too short" };
    const { error } = await supabase.from("answers").insert({ question_id: input.questionId, author_id: user.id, body_md: input.body.slice(0, 8000) });
    if (error) throw error;
    // bump status open → answered; a mod/author can still manage status from there
    await supabase.from("questions").update({ status: "answered" }).eq("id", input.questionId).eq("status", "open");
    revalidatePath(path);
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function acceptAnswer(answerId: string, path: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false, error: "Sign in first" };
    const { error } = await supabase.rpc("accept_answer", { p_answer_id: answerId });
    if (error) throw error;
    revalidatePath(path);
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function closeOwnQuestion(questionId: string, status: Extract<QuestionStatus, "closed" | "open">, path: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false, error: "Sign in first" };
    const { error } = await supabase.from("questions").update({ status }).eq("id", questionId).eq("author_id", user.id);
    if (error) throw error;
    revalidatePath(path);
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function reportIssue(input: { deviceId: string; title: string; body?: string; severity?: string; scope?: { romId?: string; rootMethodId?: string; variantId?: string } }, path: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false, error: "Sign in to report an issue" };
    if (input.title.trim().length < 6) return { ok: false, error: "Title needs at least 6 characters" };
    const severity = ["low", "medium", "high", "critical"].includes(input.severity ?? "") ? input.severity! : "medium";
    const { error } = await supabase.from("issues").insert({
      device_id: input.deviceId,
      author_id: user.id,
      title: input.title.trim().slice(0, 200),
      body_md: input.body?.slice(0, 8000) ?? null,
      severity,
      rom_id: input.scope?.romId ?? null,
      root_method_id: input.scope?.rootMethodId ?? null,
      variant_id: input.scope?.variantId ?? null,
    });
    if (error) throw error;
    revalidatePath(path);
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

// ---------- submissions ----------

export async function submitContribution(type: SubmissionType, payload: Record<string, unknown>): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false, error: "Sign in to contribute" };
    if (!type) return { ok: false, error: "Pick a submission type" };
    const clean = JSON.parse(JSON.stringify(payload ?? {}));
    const { error } = await supabase.from("submissions").insert({ user_id: user.id, type, payload: clean });
    if (error) throw error.code === "23514" ? new Error("Too many pending submissions (limit 10)") : error;
    revalidatePath("/submit");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function withdrawSubmission(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false, error: "Sign in first" };
    const { error } = await supabase.from("submissions").update({ status: "withdrawn" }).eq("id", id).eq("user_id", user.id).eq("status", "pending");
    if (error) throw error;
    revalidatePath("/submit");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

// ---------- guides (community) ----------

export async function createGuide(input: { deviceId: string | null; kind: string; title: string; summary?: string; difficulty: string }): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { ok: false, error: "Sign in first" };
    if (input.title.trim().length < 6) return { ok: false, error: "Title needs at least 6 characters" };
    const difficulty = ["easy", "moderate", "advanced", "expert"].includes(input.difficulty) ? input.difficulty : "moderate";
    const kind = ["root", "unlock_bootloader", "flash_recovery", "install_rom", "unbrick", "other"].includes(input.kind) ? input.kind : "other";
    const { error, data } = await supabase
      .from("guides")
      .insert({ device_id: input.deviceId, kind, title: input.title.trim().slice(0, 160), summary: input.summary?.slice(0, 300) ?? null, difficulty, source: "community", author_id: user.id, published: false })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: data?.id };
  } catch (e) {
    return err(e);
  }
}

// ---------- admin / moderation ----------

export async function adminReviewSubmission(id: string, approve: boolean, note?: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user || !(await isMod(supabase, user.id))) return { ok: false, error: "Moderators only" };
    const { error } = await supabase
      .from("submissions")
      .update({ status: approve ? "approved" : "rejected", reviewer_id: user.id, reviewer_note: note?.slice(0, 500) ?? null, reviewed_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending");
    if (error) throw error;
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function adminPublishGuide(guideId: string, publish: boolean): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user || !(await isMod(supabase, user.id))) return { ok: false, error: "Moderators only" };
    const { error } = await supabase.from("guides").update({ published: publish }).eq("id", guideId);
    if (error) throw error;
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function adminSetIssueStatus(issueId: string, status: IssueStatus, resolution?: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user || !(await isMod(supabase, user.id))) return { ok: false, error: "Moderators only" };
    const { error } = await supabase.from("issues").update({ status, resolution_note: resolution?.slice(0, 1000) ?? undefined }).eq("id", issueId);
    if (error) throw error;
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function adminSetQuestionStatus(questionId: string, status: QuestionStatus): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (!user || !(await isMod(supabase, user.id))) return { ok: false, error: "Moderators only" };
    const { error } = await supabase.from("questions").update({ status }).eq("id", questionId);
    if (error) throw error;
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}
