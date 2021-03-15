const path = require("path")
const webpack = require("webpack")

module.exports = {
  config: {
    entry: {
      root: [
        "core-js/stable",
        "regenerator-runtime/runtime",
        "./static/js/entry/root"
      ],
      style: "./static/js/entry/style"
    },
    module: {
      rules: [
        {
          test: /\.(svg|ttf|woff|woff2|eot|gif|png)$/,
          use: "url-loader"
        }
      ]
    },
    resolve: {
      modules: [path.join(__dirname, "static/js"), "node_modules"],
      extensions: [".js", ".jsx", ".ts", ".tsx"]
    },
    performance: {
      hints: false
    }
  },
  babelSharedLoader: {
    test: /\.tsx?$/,
    exclude: /node_modules/,
    use: [
      {
        loader: "babel-loader",
        options: {
          presets: [
            ["@babel/preset-env", { modules: false }],
            "@babel/preset-react",
            "@babel/preset-flow"
          ],
          ignore: ["node_modules/**"],
          plugins: [
            "react-hot-loader/babel",
            "@babel/plugin-proposal-class-properties"
          ]
        }
      },
      {
        loader: "ts-loader"
      }
    ]
  }
}
