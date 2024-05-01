// eslint-disable-next-line import/no-extraneous-dependencies
const webpackMerge = require("webpack-merge")
const config = require("./webpack.config")

const exportOverrides = {
  entry: {
    exports: "./src/ExportedComponents",
  },
  output: {
    library: {
      type: "module",
    },
  },
  optimization: {
    usedExports: true,
  },
  experiments: {
    outputModule: true,
  },
}

module.exports = (_env, argv) => {
  argv.mode = process.env.NODE_ENV || "production"
  const defaultConfig = config(_env, argv)
  delete defaultConfig.entry.root
  return webpackMerge.merge(defaultConfig, exportOverrides)
}
