import type { EmbedlyConfig } from "ol-common"

const imgConfigs = {
  row: {
    key: window.SETTINGS.embedlyKey,
    width: 170,
    height: 130,
  },
  "row-reverse": {
    key: window.SETTINGS.embedlyKey,
    width: 170,
    height: 130,
  },
  "row-reverse-small": {
    key: window.SETTINGS.embedlyKey,
    width: 160,
    height: 100,
  },
  column: {
    key: window.SETTINGS.embedlyKey,
    width: 220,
    height: 170,
  },
} satisfies Record<string, EmbedlyConfig>

export { imgConfigs }
