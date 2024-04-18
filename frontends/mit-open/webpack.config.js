/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path")
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
})

const webpack = require("webpack")
const BundleTracker = require("webpack-bundle-tracker")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer")
const { withCKEditor } = require("ol-ckeditor/webpack-utils")
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin")
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin")

const { NODE_ENV, ENVIRONMENT, PORT, API_BASE_URL, WEBPACK_ANALYZE } =
  process.env

const MITOPEN_FEATURES_PREFIX = "FEATURE_"

const getFeatureFlags = () => {
  const bootstrapFeatureFlags = {}

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(MITOPEN_FEATURES_PREFIX)) {
      bootstrapFeatureFlags[key.replace(MITOPEN_FEATURES_PREFIX, "")] =
        value === "True" ? true : JSON.stringify(value)
    }
  }

  return bootstrapFeatureFlags
}

const getPostHogSettings = () => {
  if (process.env.POSTHOG_ENABLED && process.env.POSTHOG_PROJECT_API_KEY) {
    getFeatureFlags()

    return {
      api_key: JSON.stringify(process.env.POSTHOG_PROJECT_API_KEY),
      timeout: JSON.stringify(process.env.POSTHOG_TIMEOUT_MS),
      enabled: true,
      bootstrap_flags: getFeatureFlags(),
    }
  }

  return undefined
}

module.exports = (env, argv) => {
  const mode = argv.mode || NODE_ENV || "production"

  console.info("Webpack build mode is:", mode)

  const isProduction = mode === "production"

  const config = {
    mode,
    context: __dirname,
    devtool: "source-map",
    entry: {
      root: "./src/App",
    },
    output: {
      path: path.resolve(__dirname, "build"),
      ...(mode === "production"
        ? {
            filename: "[name]-[chunkhash].js",
            chunkFilename: "[id]-[chunkhash].js",
            crossOriginLoading: "anonymous",
            hashFunction: "xxhash64",
          }
        : {
            filename: "[name].js",
          }),
      publicPath: "/",
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.(svg|ttf|woff|woff2|eot|gif|png)$/,
          exclude: /@ckeditor/,
          type: "asset/inline",
        },
        {
          test: /\.tsx?$/,
          use: "swc-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          exclude: /@ckeditor/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "public/index.html",
      }),
      new CopyPlugin({
        patterns: [
          {
            from: "public",
            to: "static",
            globOptions: { ignore: ["public/index.html"] },
          },
        ],
      }),
      new BundleTracker({
        // path: path.join(__dirname, "assets"),
        filename: "webpack-stats.json",
      }),
      new webpack.DefinePlugin({
        "process.env": {
          env: { NODE_ENV: JSON.stringify(mode) },
        },
      }),
      new webpack.DefinePlugin({
        APP_SETTINGS: {
          embedlyKey: JSON.stringify(process.env.EMBEDLY_KEY),
          search_page_size: JSON.stringify(
            process.env.OPENSEARCH_DEFAULT_PAGE_SIZE,
          ),
          ckeditor_upload_url: JSON.stringify(process.env.CKEDITOR_UPLOAD_URL),
          environment: JSON.stringify(process.env.ENVIRONMENT),
          sentry_dsn: JSON.stringify(process.env.SENTRY_DSN),
          release_version: JSON.stringify(process.env.VERSION),
          posthog: getPostHogSettings(),
        },
      }),
      new webpack.EnvironmentPlugin({
        ENVIRONMENT: "production",
      }),
    ]
      .concat(
        isProduction
          ? [
              new webpack.LoaderOptionsPlugin({ minimize: true }),
              new webpack.optimize.AggressiveMergingPlugin(),
              new MiniCssExtractPlugin({
                filename: "[name]-[contenthash].css",
              }),
            ]
          : [new ReactRefreshWebpackPlugin()],
      )
      .concat(
        WEBPACK_ANALYZE === "True"
          ? [
              new BundleAnalyzerPlugin({
                analyzerMode: "static",
              }),
            ]
          : [],
      ),
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      plugins: [new TsconfigPathsPlugin()],
    },
    performance: {
      hints: false,
    },
    optimization: {
      moduleIds: "named",
      splitChunks: {
        name: "common",
        minChunks: 2,
        ...(isProduction
          ? {
              cacheGroups: {
                common: {
                  test: /[\\/]node_modules[\\/]/,
                  name: "common",
                  chunks: "all",
                },
              },
            }
          : {}),
      },
      minimize: isProduction,
      emitOnErrors: false,
    },
    devServer: {
      port: PORT || 8062,
      allowedHosts: "all",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      hot: "only",
      liveReload: false,
      historyApiFallback: true,
      static: {
        directory: path.join(__dirname, "public"),
        publicPath: "/static",
      },
      devMiddleware: {
        writeToDisk: true,
      },
      host: ENVIRONMENT === "docker" ? "0.0.0.0" : "::",
      proxy: [
        {
          context: [
            "/api",
            "/login",
            "/logout",
            "/admin",
            "/static/admin",
            "/static/hijack",
          ],
          target: API_BASE_URL,
          changeOrigin: true,
          secure: false,
          headers: {
            Origin: API_BASE_URL,
          },
        },
      ],
    },
  }
  return withCKEditor(config)
}
