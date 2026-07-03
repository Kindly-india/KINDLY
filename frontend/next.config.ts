import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Pins Turbopack's workspace root to this directory — without it, the
  // root-level package.json/package-lock.json one level up (frontend/../)
  // makes Next.js misdetect the monorepo root, which can make routes
  // resolve incorrectly (or 404) in dev.
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    minimumCacheTTL: 86400, // cache optimized images for 24h so WhatsApp CDN doesn't miss
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Source map upload — add SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT to Vercel env vars
  // Auth token: Sentry → Settings → Auth Tokens → Create (scope: project:releases, org:read)
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: { disable: true },
  disableLogger: true,
  automaticVercelMonitors: false,
});
