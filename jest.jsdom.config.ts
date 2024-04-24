import { resolve } from "path"
import type { Config } from "@jest/types"

/**
 * Base configuration for jest tests.
 */
const config: Config.InitialOptions &
  Pick<Required<Config.InitialOptions>, "setupFilesAfterEnv"> = {
  setupFilesAfterEnv: [resolve(__dirname, "./jest-shared-setup.ts")],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  moduleNameMapper: {
    "\\.svg$": "ol-test-utilities/filemocks/svgmock",
    "\\.(css|scss)$": "ol-test-utilities/filemocks/filemock",
  },
  rootDir: "./src",
}

export default config
