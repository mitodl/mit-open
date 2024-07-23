import type { EmbedlyConfig } from "ol-utilities"

const { EMBEDLY_KEY } = APP_SETTINGS

const imgConfigs = {
  row: {
    key: EMBEDLY_KEY,
    width: 170,
    height: 130,
  },
  "row-reverse": {
    key: EMBEDLY_KEY,
    width: 170,
    height: 130,
  },
  "row-reverse-small": {
    key: EMBEDLY_KEY,
    width: 160,
    height: 100,
  },
  column: {
    key: EMBEDLY_KEY,
    width: 302,
    height: 182,
  },
  large: {
    key: EMBEDLY_KEY,
    width: 385,
    height: 200,
  },
} satisfies Record<string, EmbedlyConfig>

export { imgConfigs }
