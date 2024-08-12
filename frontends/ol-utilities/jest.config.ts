import type { Config } from "@jest/types"
import baseConfig from "../jest.jsdom.config"

const config: Config.InitialOptions = {
  ...baseConfig,
  globals: {
    APP_SETTINGS: {
      MITOPEN_API_BASE_URL: "https://api.test.learn.mit.edu",
    },
  },
}

export default config
