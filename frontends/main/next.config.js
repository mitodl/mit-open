// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { webpack, isServer }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.test\.tsx$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /mockAxios\.ts/,
      }),
    )

    if (isServer) {
      config.devtool = "source-map"
    }

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
        protocol: "https",
        hostname: "*.mit.edu",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "i.embed.ly",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "ol-xpro-app-production.s3.amazonaws.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "*.edx-cdn.org",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "i1.sndcdn.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "*.medium.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "image.simplecastcdn.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "megaphone.imgix.net",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "artwork.captivate.fm",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "xpro-app-rc.s3.amazonaws.com",
        port: "",
        pathname: "**",
      },
    ],
  },
}

module.exports = nextConfig
