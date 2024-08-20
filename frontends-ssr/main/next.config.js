// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {

  // async headers() {
  //   return [
  //     {
  //       source: '/about',
  //       headers: [
  //         {
  //           key: 'x-custom-header',
  //           value: 'my custom header value',
  //         },
  //         {
  //           key: 'x-another-custom-header',
  //           value: 'my other custom header value',
  //         },
  //       ],
  //     },
  //   ]
  // },

  // async rewrites() {
	// 	return [
	// 		{
	// 			source: '/api/:path*',
	// 			destination: `${process.env.MITOL_API_BASE_URL}/:path*`,
	// 		},
	// 	]
  // },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.mit.edu',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'i.embed.ly',
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
        hostname: '*.cloudfront.net',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.edx-cdn.org',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'i1.sndcdn.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.medium.com',
        port: '',
        pathname: '**',
      },
    ],
  },
}

module.exports = nextConfig
