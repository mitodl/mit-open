// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack },
  ) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.test\.tsx$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /mockAxios\.ts/,
      }),
    )

    config.module.rules.push({
      test: /\.tsx?$/,
      use: [defaultLoaders.babel],
    })

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
        destination: "/images//:path*",
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
    ],
  },
}

module.exports = nextConfig
