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
      MITOPEN_API_BASE_URL: "https://api.test.learn.mit.edu",
      PUBLIC_URL: "",
      SITE_NAME: "MIT Open",
    },
  },
}

export default config
