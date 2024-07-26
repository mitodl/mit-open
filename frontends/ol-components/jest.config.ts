import type { Config } from "@jest/types"
import baseConfig from "../jest.jsdom.config"

const config: Config.InitialOptions = {
  ...baseConfig,
  globals: {
    APP_SETTINGS: {
      EMBEDLY_KEY: "fake-embedly-key",
    },
  },
}

export default config
