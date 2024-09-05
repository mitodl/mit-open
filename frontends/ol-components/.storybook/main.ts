import { resolve, join, dirname } from "path"
import * as dotenv from "dotenv"
import * as webpack from "webpack"

dotenv.config({ path: resolve(__dirname, "../../../.env") })

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, "package.json")))
}

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.tsx",
    "../../ol-components/src/**/*.mdx",
    "../../ol-components/src/**/*.stories.@(tsx|ts)",
  ],
  // staticDirs: [{ from: "../public", to: "/static" }],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath("@storybook/addon-webpack5-compiler-swc"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-webpack5"),
  },
  docs: {
    autodocs: "tag",
  },
  webpackFinal: async (config: any) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        APP_SETTINGS: {
          EMBEDLY_KEY: JSON.stringify(process.env.EMBEDLY_KEY),
          PUBLIC_URL: JSON.stringify(process.env.PUBLIC_URL),
        },
      }),
    )
    return config
  },
}

export default config
