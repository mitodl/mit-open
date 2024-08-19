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
