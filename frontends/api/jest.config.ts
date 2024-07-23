import type { Config } from "@jest/types"
import baseConfig from "../jest.jsdom.config"

const config: Config.InitialOptions = {
  ...baseConfig,
  setupFilesAfterEnv: [
    ...baseConfig.setupFilesAfterEnv,
    "./test-utils/setupJest.ts",
  ],
  globals: {
    APP_SETTINGS: {
      MITOPEN_AXIOS_WITH_CREDENTIALS: false,
      MIT_OPEN_API_BASE_URL: "",
    },
  },
}

export default config
