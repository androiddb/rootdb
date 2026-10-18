import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // cacheComponents off: nearly every route reads the auth cookie via Supabase,
  // so this app is dynamic-by-design (Supabase-backed SaaS, not a static site).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
