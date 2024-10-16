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
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.test\.tsx$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /mockAxios\.ts/,
      }),
    )

    // Do not do this. Added to fix "import type", but causes a strage issue where
    // the root page and layout think they're Client Components and "use client"
    // directives not properly respected.
    // https://nextjs.org/docs/app/api-reference/next-config-js/webpack
    //
    // config.module.rules.push({
    //   test: /\.tsx?$/,
    //   use: [defaultLoaders.babel],
    // })

    return config
  },

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
      /* This is intended to target the base HTML responses. These are dynamically rendered,
       * so Next.js instructs no-cache, however we are currently serving public content that
       * is cacheable. Excludes everything with a file extension so we're matching only on routes.
       */
      {
        // source: "/((?!_next/|.*\\.[a-zA-Z0-9]{2,4}$).*)",
        source: "/((?!.*\\.[a-zA-Z0-9]{2,4}$).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
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
            value: "public, max-age=600",
          },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000",
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
