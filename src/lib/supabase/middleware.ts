import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Refresh the auth token (and write the rotated cookies) — do not add logic between
  // createServerClient and getUser() or sessions can randomly log users out.
  await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // Cheap bounce for obviously-gated pages; the DB still enforces everything with RLS.
  const { data } = await supabase.auth.getUser();
  if (!data.user && (path.startsWith("/saved") || path.startsWith("/submit") || path.startsWith("/settings") || path.startsWith("/admin"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return response;
}
