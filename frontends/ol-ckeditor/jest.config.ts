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
      ckeditor_upload_url: "https://meowmeow.com",
      embedlyKey: "embedly_key",
      axios_with_credentials: "False",
      axios_base_path: "",
    },
  },
}

export default config
