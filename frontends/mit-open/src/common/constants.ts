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
    width: 220,
    height: 170,
  },
} satisfies Record<string, EmbedlyConfig>

export { imgConfigs }
