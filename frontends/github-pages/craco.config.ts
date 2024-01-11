const config = {
  webpack: {
    configure: (webpackConfig: any) => {
      webpackConfig.module.rules.push({
        test: /\.tsx?$/,
        use: {
          loader: "swc-loader",
          options: {
            parseMap: true,
          },
        },
        exclude: /node_modules/,
      })
      return webpackConfig
    },
  },
}

export default config
