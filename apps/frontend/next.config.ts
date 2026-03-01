import type { NextConfig } from "next";

// Server-side only — not exposed to the browser.
const SUPABASE_API_URL =
  process.env.SUPABASE_API_URL ??
  "https://ekkcwhpmtoxddntajlcb.supabase.co/functions/v1/api";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxy /api/* to the Supabase Edge Function.
        // The destination doubles the /api segment because the Edge Function
        // name ("api") becomes the first path segment inside Deno, and our
        // routes are registered with an /api prefix.
        source: "/api/:path*",
        destination: `${SUPABASE_API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
