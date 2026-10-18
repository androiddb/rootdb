import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Device, DeviceRootability, DeviceVariant, DeviceUpdate, Guide, Issue, Question, Rom, RootMethod, Software, Tool, Profile,
} from "@/lib/types";
import { slugFromParams } from "@/lib/types";

export const getDeviceBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("devices").select("*").eq("slug", slug).maybeSingle();
  return (data as Device) ?? null;
});

export async function loadDeviceBundle(brand: string, model: string) {
  const slug = slugFromParams(decodeURIComponent(brand).toLowerCase(), decodeURIComponent(model).toLowerCase());
  const device = await getDeviceBySlug(slug);
  if (!device) notFound();

  const supabase = await createClient();
  const id = device.id;

  const [
    { data: rootability },
    { data: variants },
    { data: roms },
    { data: methodsDevice },
    { data: methodsUniversal },
    { data: tools },
    { data: guides },
    { data: updates },
    { data: swLinks },
    { count: questionsN },
    { count: issuesN },
    { data: { user } },
  ] = await Promise.all([
    supabase.from("device_rootability").select("*").eq("device_id", id).maybeSingle(),
    supabase.from("device_variants").select("*").eq("device_id", id).order("sort_order"),
    supabase.from("roms").select("*").eq("device_id", id).order("status").order("name"),
    supabase.from("root_methods").select("*").eq("device_id", id).order("weight", { ascending: false }),
    supabase.from("root_methods").select("*").is("device_id", null).order("weight", { ascending: false }),
    supabase.from("tools").select("*").eq("device_id", id).order("kind").order("name"),
    supabase.from("guides").select("*").eq("device_id", id).eq("published", true).order("created_at", { ascending: false }),
    supabase.from("device_updates").select("*").eq("device_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("software_devices").select("software_id").eq("device_id", id),
    supabase.from("questions").select("id", { count: "exact", head: true }).eq("device_id", id),
    supabase.from("issues").select("id", { count: "exact", head: true }).eq("device_id", id),
    supabase.auth.getUser(),
  ]);

  const recommendedMethodId = (rootability as DeviceRootability | null)?.recommended_method_id ?? null;
  let recommended: RootMethod | null = null;
  if (recommendedMethodId) {
    const { data } = await supabase.from("root_methods").select("*").eq("id", recommendedMethodId).maybeSingle();
    recommended = (data as RootMethod) ?? null;
  }

  // device-linked software (apps + modules)
  let software: Software[] = [];
  const swIds = (swLinks ?? []).map((l) => l.software_id as string);
  if (swIds.length) {
    const { data } = await supabase.from("software").select("*").in("id", swIds).order("kind").order("name");
    software = (data ?? []) as Software[];
  }

  // saved?
  let saved = false;
  let profile: Profile | null = null;
  if (user) {
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from("saved_devices").select("device_id").eq("device_id", id).eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);
    saved = !!s;
    profile = (p as Profile) ?? null;
  }

  // generic guides that can appear anywhere (published, no device) — for spotlight
  const { data: genericGuides } = await supabase
    .from("guides")
    .select("*")
    .is("device_id", null)
    .eq("published", true)
    .order("created_at", { ascending: false });

  // confirmations for the current user's targets on this device page
  const targetIds = [
    ...(roms ?? []).map((r) => r.id),
    ...(methodsDevice ?? []).map((m) => m.id),
    ...(methodsUniversal ?? []).map((m) => m.id),
  ];
  let confirmedSet = new Set<string>();
  if (user && targetIds.length) {
    const { data: confs } = await supabase
      .from("confirmations")
      .select("target_id")
      .in("target_id", targetIds)
      .eq("user_id", user.id);
    confirmedSet = new Set((confs ?? []).map((c) => c.target_id as string));
  }

  return {
    device,
    rootability: (rootability as DeviceRootability) ?? null,
    variants: (variants ?? []) as DeviceVariant[],
    roms: (roms ?? []) as Rom[],
    methodsDevice: (methodsDevice ?? []) as RootMethod[],
    methodsUniversal: (methodsUniversal ?? []) as RootMethod[],
    tools: (tools ?? []) as Tool[],
    guides: (guides ?? []) as Guide[],
    genericGuides: (genericGuides ?? []) as Guide[],
    updates: (updates ?? []) as DeviceUpdate[],
    software,
    recommended,
    counts: {
      roms: roms?.length ?? 0,
      methods: (methodsDevice?.length ?? 0) + (methodsUniversal?.length ?? 0),
      tools: tools?.length ?? 0,
      guides: (guides?.length ?? 0) + (genericGuides?.length ?? 0),
      questions: questionsN ?? 0,
      issues: issuesN ?? 0,
      updates: updates?.length ?? 0,
    },
    auth: { authed: !!user, profile, saved },
    confirmedSet,
  };
}

export type DeviceBundle = Awaited<ReturnType<typeof loadDeviceBundle>>;

/** Resolve the rootability picture for a chosen variant (falls back to device-level row). */
export function effectiveVerdict(bundle: Pick<DeviceBundle, "rootability" | "variants">, variantId: string | null): {
  verdict: NonNullable<DeviceRootability>["verdict"];
  bootloader: NonNullable<DeviceRootability>["bootloader"];
  warnings: string[];
  notes: string | null;
  unlockUrl: string | null;
  source: "device" | "variant";
} {
  const base = bundle.rootability;
  const variant = variantId ? bundle.variants.find((v) => v.id === variantId) : null;
  if (variant && (variant.verdict || variant.bootloader)) {
    return {
      verdict: variant.verdict ?? base?.verdict ?? "unknown",
      bootloader: variant.bootloader ?? base?.bootloader ?? "unknown",
      warnings: variant.warnings.length ? variant.warnings : base?.warnings ?? [],
      notes: variant.bootloader_notes ?? base?.notes ?? null,
      unlockUrl: variant.unlock_url ?? base?.unlock_url ?? null,
      source: "variant",
    };
  }
  return {
    verdict: base?.verdict ?? "unknown",
    bootloader: base?.bootloader ?? "unknown",
    warnings: base?.warnings ?? [],
    notes: base?.notes ?? null,
    unlockUrl: base?.unlock_url ?? null,
    source: "device",
  };
}
