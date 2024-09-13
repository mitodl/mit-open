import type { Config } from "@jest/types"
import baseConfig from "../jest.jsdom.config"

const config: Config.InitialOptions = {
  ...baseConfig,
  transformIgnorePatterns: [
    "/node_modules/(?!(" +
      "@ckeditor/*" +
      "|ckeditor5/*" +
      "|lodash-es" +
      "|vanilla-colorful" +
      ")/)",
  ],
  moduleNameMapper: {
    "\\.svg$": "ol-test-utilities/filemocks/raw-svgmock.js",
    "\\.(css|scss)$": "ol-test-utilities/filemocks/filemock.js",
  },
  globals: {
    APP_SETTINGS: {
      CKEDITOR_UPLOAD_URL: "https://meowmeow.com",
      EMBEDLY_KEY: "embedly_key",
      MITOL_AXIOS_WITH_CREDENTIALS: false,
      MITOL_API_BASE_URL: "https://api.test.learn.mit.edu",
    },
  },
}

export default config
