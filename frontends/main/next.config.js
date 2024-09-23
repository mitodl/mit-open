// @ts-check
const { validateEnv } = require("./validateEnv")

validateEnv()

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
