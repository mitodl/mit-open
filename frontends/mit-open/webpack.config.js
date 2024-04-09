/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path")
const webpack = require("webpack")
const BundleTracker = require("webpack-bundle-tracker")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer")
const { withCKEditor } = require("ol-ckeditor/webpack-utils")
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")

const STATS_FILEPATH = path.resolve(
  __dirname,
  "../../webpack-stats/mit-open.json",
)

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
  if (
    process.env.POSTHOG_ENABLED === "True" &&
    process.env.POSTHOG_PROJECT_API_KEY
  ) {
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

const validateEnv = (isProduction) => {
  if (isProduction) return
  if (!process.env.WEBPACK_PORT_MITOPEN) {
    throw new Error("WEBPACK_PORT_MITOPEN should be defined")
  }
}

const getWebpackConfig = ({ mode, analyzeBundle }) => {
  const isProduction = mode === "production"
  validateEnv(isProduction)
  const publicPath = getPublicPath(isProduction)

  console.info("Public path is:", publicPath)
  const config = {
    mode,
    context: __dirname,
    devtool: "source-map",
    entry: {
      root: "./src/App",
    },
    output: {
      path: path.resolve(__dirname, "build"),
      ...(isProduction
        ? {
            filename: "[name]-[chunkhash].js",
            chunkFilename: "[id]-[chunkhash].js",
            crossOriginLoading: "anonymous",
            hashFunction: "xxhash64",
          }
        : {
            filename: "[name].js",
          }),
      publicPath,
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
      new BundleTracker({ filename: STATS_FILEPATH }),
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
          : [],
      )
      .concat(
        analyzeBundle
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
      allowedHosts: "all",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      host: "::",
      port: process.env.WEBPACK_PORT_MITOPEN,
    },
  }
  return withCKEditor(config)
}

module.exports = (_env, argv) => {
  const mode = argv.mode || process.env.NODE_ENV || "production"

  console.info("Mode is:", mode)

  const analyzeBundle = process.env.WEBPACK_ANALYZE === "True"
  const settings = { mode, analyzeBundle }
  return getWebpackConfig(settings)
}
