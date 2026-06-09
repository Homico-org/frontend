const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    // `images.domains` was deprecated in Next.js 14 in favor of the more
    // expressive `remotePatterns`. Migrated the lone `localhost` entry
    // to an http remotePattern so local dev image loads keep working
    // alongside the existing https wildcard for production CDNs.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // Optimize imports for better tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{lowerCase kebabCase member}}',
    },
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
  },
  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'framer-motion'],
  },
  // Short URL alias for SMS invites: /i/<token> → /invite/<token> (saves 6 chars)
  async rewrites() {
    return [
      { source: '/i/:token', destination: '/invite/:token' },
      // The /projects/* routes live at the top level (not under the
      // [country] segment), but the app navigates with a country prefix
      // (cl()) and users land on /ge/... URLs. These rewrites strip the
      // marketplace prefix so /ge/projects/123 serves /projects/123. The
      // visible URL is preserved, so useCountry() still reads the prefix.
      {
        source: '/:country(ge|us|il|fr|de|uk|gb)/projects/:path*',
        destination: '/projects/:path*',
      },
      // Forgiving alias: singular /project/* (with or without country
      // prefix) serves the canonical plural /projects/* route.
      {
        source: '/:country(ge|us|il|fr|de|uk|gb)/project/:path*',
        destination: '/projects/:path*',
      },
      { source: '/project/:path*', destination: '/projects/:path*' },
      // Bookings also live at the top level (under the (shell) group), but
      // cl()-wrapped links and notification deep-links can produce
      // /ge/bookings/... URLs. Strip the marketplace prefix so they resolve
      // (same approach as /projects above) instead of 404ing.
      {
        source: '/:country(ge|us|il|fr|de|uk|gb)/bookings/:path*',
        destination: '/bookings/:path*',
      },
    ];
  },
}

const nextConfigWithAnalyzer = withBundleAnalyzer(nextConfig);

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  // skipWaiting + clientsClaim = a freshly-deployed service worker activates
  // AND takes control of already-open tabs immediately, so a deploy is picked
  // up without users having to fully close the app. (Navigations are already
  // NetworkFirst and JS/CSS are content-hashed, so no stale bundles ship.)
  skipWaiting: true,
  clientsClaim: true,
  disable: process.env.NODE_ENV !== 'production',
  fallbacks: {
    document: '/offline',
  },
});
const nextConfigWithPWA = withPWA(nextConfigWithAnalyzer);

// Only enable Sentry release/sourcemap upload in production *when auth is configured*.
// Runtime Sentry (capturing errors) is still controlled by sentry.*.config.ts and does NOT require an auth token.
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_AUTH_TOKEN) {
  const { withSentryConfig } = require("@sentry/nextjs");

  module.exports = withSentryConfig(nextConfigWithPWA, {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "homico-k4",
    project: "javascript-nextjs",
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Disable Sentry SDK instrumentation in development
    disableLogger: true,

    webpack: {
      // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
      // See the following for more information:
      // https://docs.sentry.io/product/crons/
      // https://vercel.com/docs/cron-jobs
      automaticVercelMonitors: true,

      // Tree-shaking options for reducing bundle size
      treeshake: {
        // Automatically tree-shake Sentry logger statements to reduce bundle size
        removeDebugLogging: true,
      },
    },
  });
} else {
  module.exports = nextConfigWithPWA;
}
