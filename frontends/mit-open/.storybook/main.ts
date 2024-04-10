import { join, dirname } from "path"

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
  staticDirs: ["../../../static"],
  env: (config: any) => ({
    ...config,
    PUBLIC_URL: process.env.PUBLIC_URL || "",
    EMBEDLY_KEY: process.env.EMBEDLY_KEY || "",
  }),
}

export default config
