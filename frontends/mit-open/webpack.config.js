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
const { cleanEnv, str, bool, port } = require("envalid")

const {
  NODE_ENV,
  ENVIRONMENT,
  PORT,
  MITOPEN_AXIOS_BASE_PATH,
  API_DEV_PROXY_BASE_URL,
  WEBPACK_ANALYZE,
  SITE_NAME,
  MITOPEN_SUPPORT_EMAIL,
} = cleanEnv(process.env, {
  ENVIRONMENT: str({
    choices: ["local", "docker", "production"],
    default: "production",
  }),
  NODE_ENV: str({
    choices: ["development", "production", "test"],
    default: "production",
  }),
  PORT: port({
    desc: "Port to run the development server on",
    default: 8062,
  }),
  MITOPEN_AXIOS_BASE_PATH: str({
    desc: "Base URL for API requests",
    devDefault: "",
  }),
  API_DEV_PROXY_BASE_URL: str({
    desc: "API base URL to proxy to in development mode",
    default: "",
    devDefault: process.env.MITOPEN_BASE_URL,
  }),
  WEBPACK_ANALYZE: bool({
    desc: "Whether to run webpack bundle analyzer",
    default: false,
  }),
  SITE_NAME: str({
    desc: ["The name of the site, used in page titles"],
    default: "MIT Open",
  }),
  MITOPEN_SUPPORT_EMAIL: str({
    desc: "Email address for support",
    default: "mitopen-support@mit.edu",
  }),
})

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
    process.env.POSTHOG_PROJECT_API_KEY &&
    process.env.POSTHOG_PROJECT_API_KEY.length > 0
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

module.exports = (env, argv) => {
  const mode = argv.mode || NODE_ENV || "production"

  console.info("Webpack build mode is:", mode)

  const isProduction = mode === "production"

  const config = {
    mode,
    context: __dirname,
    devtool: isProduction ? "source-map" : "eval-source-map",
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
      clean: !isProduction,
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
          {
            from: path.resolve(__dirname, "public"),
            to: path.resolve(__dirname, "build"),
            globOptions: {
              ignore: ["**/index.html", "**/images/**"],
            },
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
          axios_with_credentials: JSON.stringify(
            process.env.MITOPEN_AXIOS_WITH_CREDENTIALS,
          ),
          axios_base_path: JSON.stringify(process.env.MITOPEN_AXIOS_BASE_PATH),
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
        // within app, define process.env.VAR_NAME with default from cleanEnv
        MITOPEN_AXIOS_BASE_PATH,
        ENVIRONMENT,
        SITE_NAME,
        MITOPEN_SUPPORT_EMAIL,
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
        ENVIRONMENT !== "local" && WEBPACK_ANALYZE === "True"
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
      port: PORT,
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
          target: API_DEV_PROXY_BASE_URL || MITOPEN_AXIOS_BASE_PATH,
          changeOrigin: true,
          secure: false,
          headers: {
            Origin: API_DEV_PROXY_BASE_URL || MITOPEN_AXIOS_BASE_PATH,
          },
        },
      ],
    },
  }
  return withCKEditor(config)
}
