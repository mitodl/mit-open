/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path")
const webpack = require("webpack")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
// const { BundleAnalyzerPlugin } = requir("webpack-bundle-analyzer")
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")
const { styles } = require("@ckeditor/ckeditor5-dev-utils")
const {
  CKEditorTranslationsPlugin,
} = require("@ckeditor/ckeditor5-dev-translations")

const getPublicPath = (isProduction) => {
  const { MITOPEN_HOSTNAME: hostname, WEBPACK_PORT_MITOPEN: port } = process.env
  const buildPath = "/static/mit-open/"
  if (isProduction) return buildPath
  if (!hostname || !port) {
    throw new Error(
      `hostname (${hostname}) and port (${port}) should both be defined.`,
    )
  }
  return `http://${hostname}:${port}/`
}

const validateEnv = (isPorduction) => {
  if (isPorduction) return
  if (!process.env.WEBPACK_PORT_MITOPEN) {
    throw new Error("WEBPACK_PORT_MITOPEN should be defined")
  }
}

const getWebpackConfig = ({ mode }) => {
  const isProduction = mode === "production"
  validateEnv(isProduction)
  const publicPath = getPublicPath(isProduction)
  const config = {
    mode,
    context: __dirname,
    // devtool: "source-map",
    entry: {
      root: "./src/index",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "index.js",
      publicPath,
    },
    module: {
      rules: [
        {
          test: /\.(svg|ttf|woff|woff2|eot|gif|png)$/,
          type: "asset/inline",
        },
        {
          test: /\.tsx?$/,
          use: "swc-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$|\.scss$/,
          include: [path.resolve(__dirname, "src/styles")],
          use: [
            {
              loader: isProduction
                ? MiniCssExtractPlugin.loader
                : "style-loader",
            },
            "css-loader",
            "postcss-loader",
            "sass-loader",
          ],
        },
        {
          test: /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
          use: ["raw-loader"],
        },
        {
          test: /ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/,
          use: [
            {
              loader: "style-loader",
              options: {
                injectType: "singletonStyleTag",
                attributes: {
                  "data-cke": true,
                },
              },
            },
            "css-loader",
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: styles.getPostCssConfig({
                  themeImporter: {
                    themePath: require.resolve(
                      "@ckeditor/ckeditor5-theme-lark",
                    ),
                  },
                  minify: true,
                }),
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env": {
          env: { NODE_ENV: JSON.stringify(mode) },
        },
      }),
      new CKEditorTranslationsPlugin({
        language: "en",
        addMainLanguageTranslationsToAllAssets: true,
      }),
      new MiniCssExtractPlugin({
        filename: "styles.css",
      }),
    ],
    // .concat(
    //   isProduction
    //     ? [
    //         new webpack.LoaderOptionsPlugin({ minimize: true }),
    //         new webpack.optimize.AggressiveMergingPlugin(),
    //         new MiniCssExtractPlugin({
    //           filename: "[name]-[contenthash].css",
    //         }),
    //       ]
    //     : [],
    // )
    // .concat(
    //   analyzeBundle
    //     ? [
    //         new BundleAnalyzerPlugin({
    //           analyzerMode: "static",
    //         }),
    //       ]
    //     : [],
    // ),
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      plugins: [new TsconfigPathsPlugin()],
    },
    performance: {
      hints: false,
    },
    // optimization: {
    //   moduleIds: "named",
    //   splitChunks: {
    //     name: "common",
    //     minChunks: 2,
    //     ...(isProduction
    //       ? {
    //           cacheGroups: {
    //             common: {
    //               test: /[\\/]node_modules[\\/]/,
    //               name: "common",
    //               chunks: "all",
    //             },
    //           },
    //         }
    //       : {}),
    //   },
    //   minimize: isProduction,
    //   emitOnErrors: false,
    // },
    devServer: {
      allowedHosts: "all",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      host: "::",
      port: process.env.WEBPACK_PORT_MITOPEN,
    },
  }

  return config
}

module.exports = (_env, argv) => {
  const mode = argv.mode || process.env.NODE_ENV || "production"
  const analyzeBundle = process.env.WEBPACK_ANALYZE === "True"
  const settings = { mode, analyzeBundle }
  return getWebpackConfig(settings)
}
