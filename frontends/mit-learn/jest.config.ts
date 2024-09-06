import path from "path"
import type { Config } from "@jest/types"
import baseConfig from "../jest.jsdom.config"

const config: Config.InitialOptions = {
  ...baseConfig,
  setupFilesAfterEnv: [
    ...baseConfig.setupFilesAfterEnv,
    "./test-utils/setupJest.ts",
  ],
  moduleNameMapper: {
    "^@/(.*)$": path.resolve(__dirname, "src/$1"),
    ...baseConfig.moduleNameMapper,
  },
  transformIgnorePatterns: ["/node_modules/(?!(" + "yaml", ")/)"],
  globals: {
    APP_SETTINGS: {
      EMBEDLY_KEY: "embedly_key",
      MITOL_API_BASE_URL: "https://api.test.learn.mit.edu",
      PUBLIC_URL: "",
      SITE_NAME: "MIT Learn",
      DEFAULT_SEARCH_MODE: "phrase",
      DEFAULT_SEARCH_SLOP: 6,
      DEFAULT_SEARCH_STALENESS_PENALTY: 2.5,
      DEFAULT_SEARCH_MINIMUM_SCORE_CUTOFF: 0,
      DEFAULT_SEARCH_MAX_INCOMPLETENESS_PENALTY: 90,
    },
  },
}

export default config
