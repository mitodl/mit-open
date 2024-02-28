import type { EmbedlyConfig } from "ol-utilities"

const SETTINGS = {
  embedlyKey: "1234", // TODO
}

const imgConfigs = {
  row: {
    key: SETTINGS.embedlyKey,
    width: 170,
    height: 130,
  },
  "row-reverse": {
    key: SETTINGS.embedlyKey,
    width: 170,
    height: 130,
  },
  "row-reverse-small": {
    key: SETTINGS.embedlyKey,
    width: 160,
    height: 100,
  },
  column: {
    key: SETTINGS.embedlyKey,
    width: 220,
    height: 170,
  },
} satisfies Record<string, EmbedlyConfig>

export { imgConfigs }
