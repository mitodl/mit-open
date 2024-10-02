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

  return { FEATURE_FLAGS: JSON.stringify(bootstrapFeatureFlags) }
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
      new webpack.EnvironmentPlugin(processFeatureFlags()),
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
}

module.exports = nextConfig
