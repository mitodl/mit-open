import { resolve } from "path"
import type { Config } from "@jest/types"

process.env.SITE_NAME = "MIT Open"

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
    "\\.svg$": "ol-test-utilities/filemocks/svgmock.js",
    "\\.(css|scss)$": "ol-test-utilities/filemocks/filemock.js",
  },
  rootDir: "./src",
}

export default config
