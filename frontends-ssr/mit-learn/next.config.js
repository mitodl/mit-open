// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.embed.ly',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'ocw.mit.edu',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'mitxonline.mit.edu',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'ol-xpro-app-production.s3.amazonaws.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'prolearn.mit.edu',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'prod-discovery.edx-cdn.org',
        port: '',
        pathname: '**',
      },
    ],
  },
}

module.exports = nextConfig
