import type { NextConfig } from "next";

// Server-side only — not exposed to the browser.
const SUPABASE_API_URL =
  process.env.SUPABASE_API_URL ??
  "https://your-project-ref.supabase.co/functions/v1/api";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxy /api/* to the Supabase Edge Function.
        // Supabase prepends the function name ("api") as the first path
        // segment inside Deno, so /api/users/me arrives as /api/users/me —
        // no duplication needed in the destination.
        source: "/api/:path*",
        destination: `${SUPABASE_API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
