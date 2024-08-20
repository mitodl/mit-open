// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {

  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {

    config.plugins.push(
      new webpack.IgnorePlugin({
        // Ignore test files
        resourceRegExp: /\.test\.tsx$/
      })
    );

    config.module.rules.push({
      test: /\.tsx?$/,
      use: [
        defaultLoaders.babel,
      ],
    });

    return config;
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
    ],
  },
}

module.exports = nextConfig
