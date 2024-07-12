import type { EmbedlyConfig } from "ol-utilities"

const imgConfigs = {
  row: {
    key: APP_SETTINGS.embedlyKey,
    width: 170,
    height: 130,
  },
  "row-reverse": {
    key: APP_SETTINGS.embedlyKey,
    width: 170,
    height: 130,
  },
  "row-reverse-small": {
    key: APP_SETTINGS.embedlyKey,
    width: 160,
    height: 100,
  },
  column: {
    key: APP_SETTINGS.embedlyKey,
    width: 302,
    height: 182,
  },
  large: {
    key: APP_SETTINGS.embedlyKey,
    width: 385,
    height: 200,
  },
} satisfies Record<string, EmbedlyConfig>

export { imgConfigs }
