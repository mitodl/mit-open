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
      /* HTML responses. These are dynamically rendered, so Next.js instructs no-cache,
       * however we are currently serving public content that is cacheable. */
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/about",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/c",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/c/[channelType]",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/c/[channelType]/[name]",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/cart",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/dashboard",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/dashboard/[tab]",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/dashboard/[tab]/[id]",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/departments",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/learningpaths",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/learningpaths/[id]",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/onboarding",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/privacy",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/program_letter",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/program_letter/[id]",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/program_letter/[id]/view",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/search",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/terms",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/topics",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120",
          },
        ],
      },
      {
        source: "/unit",
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
