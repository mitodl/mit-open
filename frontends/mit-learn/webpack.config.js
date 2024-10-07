/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path")

if (process.env.LOAD_ENV_FILES?.toLowerCase() === "true") {
  console.info("Loading environment from .env files")
  require("dotenv").config({
    path: [
      path.resolve(__dirname, "../../env/frontend.local.env"),
      path.resolve(__dirname, "../../env/frontend.env"),
      path.resolve(__dirname, "../../env/shared.local.env"),
      path.resolve(__dirname, "../../env/shared.env"),
      path.resolve(__dirname, "../../.env"),
    ],
  })
}

const webpack = require("webpack")
const BundleTracker = require("webpack-bundle-tracker")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer")
const { withCKEditor } = require("ol-ckeditor/webpack-utils")
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin")
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin")
const { cleanEnv, str, bool, port, num } = require("envalid")

const {
  NODE_ENV,
  PORT,
  VERSION,
  MITOL_API_BASE_URL,
  API_DEV_PROXY_BASE_URL,
  WEBPACK_ANALYZE,
  SITE_NAME,
  PUBLIC_URL,
  MITOL_SUPPORT_EMAIL,
  MITOL_AXIOS_WITH_CREDENTIALS,
  EMBEDLY_KEY,
  CKEDITOR_UPLOAD_URL,
  SENTRY_DSN,
  SENTRY_ENV,
  SENTRY_TRACES_SAMPLE_RATE,
  SENTRY_PROFILES_SAMPLE_RATE,
  CSRF_COOKIE_NAME,
  APPZI_URL,
  MITOL_NOINDEX,
  DEFAULT_SEARCH_MODE,
  DEFAULT_SEARCH_SLOP,
  DEFAULT_SEARCH_STALENESS_PENALTY,
  DEFAULT_SEARCH_MINIMUM_SCORE_CUTOFF,
  DEFAULT_SEARCH_MAX_INCOMPLETENESS_PENALTY,
} = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "production", "test"],
    default: "production",
  }),
  PORT: port({
    desc: "Port to run the development server on",
    default: 8062,
  }),
  VERSION: str({
    desc: "The current release version",
    default: "0.0.0",
  }),
  MITOL_API_BASE_URL: str({
    desc: "Base URL for API requests",
    devDefault: "",
  }),
  API_DEV_PROXY_BASE_URL: str({
    desc: "API base URL to proxy to in development mode",
    default: "",
    devDefault: "",
  }),
  WEBPACK_ANALYZE: bool({
    desc: "Whether to run webpack bundle analyzer",
    default: false,
  }),
  SITE_NAME: str({
    desc: "The name of the site, used in page titles",
    default: "MIT Learn",
  }),
  PUBLIC_URL: str({
    desc: "The site URL, for display",
    default: "",
  }),
  MITOL_SUPPORT_EMAIL: str({
    desc: "Email address for support",
    default: "mitlearn-support@mit.edu",
  }),
  MITOL_AXIOS_WITH_CREDENTIALS: bool({
    desc: "Instructs the Axios API client to send credentials with requests",
    default: false,
  }),
  EMBEDLY_KEY: str({
    desc: "Public API key for Embedly",
    default: "EMBEDLY_KEY",
  }),
  CKEDITOR_UPLOAD_URL: str({
    desc: "Location of the CKEditor uploads handler",
    default: "",
  }),
  SENTRY_ENV: str({
    desc: "A label for the environment used for grouping errors in Sentry",
    default: "",
  }),
  SENTRY_DSN: str({
    desc: "Sentry Data Source Name",
    default: "",
  }),
  SENTRY_TRACES_SAMPLE_RATE: num({
    desc: "Sentry tracing sample rate",
    default: 0.0,
  }),
  SENTRY_PROFILES_SAMPLE_RATE: num({
    desc: "Sentry profiling sample rate",
    default: 0.0,
  }),
  CSRF_COOKIE_NAME: str({
    desc: "Name of the CSRF cookie",
    default: "csrftoken",
  }),
  APPZI_URL: str({
    // use str() not url() to allow empty string
    desc: "URL for the Appzi feedback widget",
    default: "",
  }),
  MITOL_NOINDEX: bool({
    desc: "Whether to include a noindex meta tag",
    default: true,
  }),
  DEFAULT_SEARCH_SLOP: num({
    desc: "The default search slop",
    default: 6,
  }),
  DEFAULT_SEARCH_STALENESS_PENALTY: num({
    desc: "The default search staleness penalty",
    default: 2.5,
  }),
  DEFAULT_SEARCH_MINIMUM_SCORE_CUTOFF: num({
    desc: "The default search minimum score cutoff",
    default: 0,
  }),
  DEFAULT_SEARCH_MAX_INCOMPLETENESS_PENALTY: num({
    desc: "The default search max incompleteness penalty",
    default: 90,
  }),
  DEFAULT_SEARCH_MODE: str({
    desc: "The default search mode",
    default: "phrase",
  }),
})

const MITOL_FEATURES_PREFIX = "FEATURE_"

const getFeatureFlags = () => {
  const bootstrapFeatureFlags = {}

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(MITOL_FEATURES_PREFIX)) {
      bootstrapFeatureFlags[key.replace(MITOL_FEATURES_PREFIX, "")] =
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
          use: {
            loader: "swc-loader",
            options: {
              jsc: {
                experimental: {
                  plugins: [["@swc/plugin-emotion", {}]],
                },
              },
            },
          },
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
        templateParameters: {
          APPZI_URL,
          MITOL_NOINDEX,
        },
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
          MITOL_AXIOS_WITH_CREDENTIALS,
          MITOL_API_BASE_URL: JSON.stringify(MITOL_API_BASE_URL),
          EMBEDLY_KEY: JSON.stringify(EMBEDLY_KEY),
          CKEDITOR_UPLOAD_URL: JSON.stringify(CKEDITOR_UPLOAD_URL),
          VERSION: JSON.stringify(VERSION),
          SENTRY_DSN: JSON.stringify(SENTRY_DSN),
          SENTRY_ENV: JSON.stringify(SENTRY_ENV),
          SENTRY_PROFILES_SAMPLE_RATE,
          SENTRY_TRACES_SAMPLE_RATE,
          POSTHOG: getPostHogSettings(),
          SITE_NAME: JSON.stringify(SITE_NAME),
          MITOL_SUPPORT_EMAIL: JSON.stringify(MITOL_SUPPORT_EMAIL),
          PUBLIC_URL: JSON.stringify(PUBLIC_URL),
          CSRF_COOKIE_NAME: JSON.stringify(CSRF_COOKIE_NAME),
          DEFAULT_SEARCH_MODE: JSON.stringify(DEFAULT_SEARCH_MODE),
          DEFAULT_SEARCH_MAX_INCOMPLETENESS_PENALTY,
          DEFAULT_SEARCH_MINIMUM_SCORE_CUTOFF,
          DEFAULT_SEARCH_SLOP,
          DEFAULT_SEARCH_STALENESS_PENALTY,
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
          : [new ReactRefreshWebpackPlugin()],
      )
      .concat(
        WEBPACK_ANALYZE
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
      host: "0.0.0.0",
      proxy: API_DEV_PROXY_BASE_URL
        ? [
            {
              context: [
                "/api",
                "/login",
                "/logout",
                "/admin",
                "/static/admin",
                "/static/hijack",
              ],
              target: API_DEV_PROXY_BASE_URL,
              changeOrigin: true,
              secure: false,
              headers: {
                Origin: API_DEV_PROXY_BASE_URL,
              },
            },
          ]
        : [],
    },
  }
  return withCKEditor(config)
}
