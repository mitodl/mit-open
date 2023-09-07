import type { Config } from "@jest/types"
import baseConfig from "../../jest.jsdom.config"

const _createSettings = () => ({
  embedlyKey: "fake-embedly-key"
})

const config: Config.InitialOptions = {
  ...baseConfig,
  globals: {
    SETTINGS: _createSettings()
  }
}

export default config
