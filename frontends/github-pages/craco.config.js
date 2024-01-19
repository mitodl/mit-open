module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      webpackConfig.module.rules.push(
        {
          test: /\.tsx?$/,
          loader: "babel-loader",
        },
        {
          test: /\.(svg|ttf|woff|woff2|eot|gif|png)$/,
          type: "asset/inline",
        },
        {
          test: /\.tsx?$/,
          use: {
            loader: "swc-loader",
            options: {
              parseMap: true,
            },
          },
          exclude: /node_modules/,
        },
      )
      return webpackConfig
    },
  },
}
