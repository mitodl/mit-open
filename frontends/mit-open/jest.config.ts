import path from "path"
import type { Config } from "@jest/types"
import baseConfig from "../../jest.jsdom.config"

const config: Config.InitialOptions = {
  ...baseConfig,
  setupFilesAfterEnv: [
    ...baseConfig.setupFilesAfterEnv,
    "./test-utils/setupJest.ts",
  ],
  moduleNameMapper: {
    "^common/(.*)$": path.resolve(__dirname, "src/common/$1"),
    "^components/(.*)$": path.resolve(__dirname, "src/components/$1"),
    "^page-components/(.*)$": path.resolve(__dirname, "src/page-components/$1"),
    "^pages/(.*)$": path.resolve(__dirname, "src/pages/$1"),
    "^services/(.*)$": path.resolve(__dirname, "src/services/$1"),
    ...baseConfig.moduleNameMapper,
  },
}

export default config
