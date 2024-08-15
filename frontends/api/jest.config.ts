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
      MITOL_AXIOS_WITH_CREDENTIALS: false,
      MITOL_API_BASE_URL: "https://api.test.learn.mit.edu",
      CSRF_COOKIE_NAME: "csrftoken-test",
    },
  },
}

export default config
