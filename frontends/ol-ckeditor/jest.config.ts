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
  globals: {
    APP_SETTINGS: {
      CKEDITOR_UPLOAD_URL: "https://meowmeow.com",
      EMBEDLY_KEY: "embedly_key",
      MITOPEN_AXIOS_WITH_CREDENTIALS: false,
      MITOPEN_API_BASE_URL: "https://api.mitopen-test.odl.mit.edu",
    },
  },
}

export default config
