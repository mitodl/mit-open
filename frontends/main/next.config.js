// @ts-check
const { validateEnv } = require("./validateEnv")

validateEnv()

const processFeatureFlags = () => {
  const featureFlagPrefix =
    process.env.NEXT_PUBLIC_POSTHOG_FEATURE_PREFIX || "FEATURE_"
  const bootstrapFeatureFlags = {}

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(`NEXT_PUBLIC_${featureFlagPrefix}`)) {
      bootstrapFeatureFlags[
        key.replace(`NEXT_PUBLIC_${featureFlagPrefix}`, "")
      ] = value === "True" ? true : JSON.stringify(value)
    }
  }

  return bootstrapFeatureFlags
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      /* Images moved from /static, though image paths are sometimes
       * returned on the API, e.g. /api/v0/channels/type/unit/ocw/
       * TODO update API paths and remove the rewrite.
       */
      {
        source: "/static/images/:path*",
        destination: "/images/:path*",
      },
    ]
  },

  async headers() {
    return [
      /* This is intended to target the base HTML responses. Some are dynamically rendered,
       * so Next.js instructs no-cache, however we are currently serving public content that
       * is cacheable. Excludes everything with a file extension so we're matching only on routes.
       */
      {
        source: "/((?!.*\\.[a-zA-Z0-9]{2,4}$).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=1800",
          },
        ],
      },

      /* Images rendered with the Next.js Image component have the cache header
       * set on them, but CSS background images do not.
       */
      {
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=31536000",
          },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=31536000",
          },
        ],
      },
    ]
  },

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "**",
      },
    ],
  },

  env: {
    FEATURE_FLAGS: JSON.stringify(processFeatureFlags()),
  },
}

module.exports = nextConfig
