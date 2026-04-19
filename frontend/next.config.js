const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ktdhcxgfbtbrszayrwuj.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Source map upload — add SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT to Vercel env vars
  // Auth token: Sentry → Settings → Auth Tokens → Create (scope: project:releases, org:read)
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});