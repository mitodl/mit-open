import type { Config } from "@jest/types"
import baseConfig from "../../jest.jsdom.config"

const config: Config.InitialOptions = {
  ...baseConfig,
  transformIgnorePatterns: ["/node_modules/(?!(" + "jsonpath-plus" + ")/)"]
}

export default config
