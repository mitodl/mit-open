import { faker } from "@faker-js/faker/locale/en"
import type { Factory } from "ol-util/factories"
import type { EmbedlyConfig } from "../utils/"

const makeImgConfig: Factory<EmbedlyConfig> = overrides => {
  const imgConfig = {
    width:  faker.datatype.number(),
    height: faker.datatype.number(),
    key:    faker.datatype.uuid()
  }
  return {
    ...imgConfig,
    ...overrides
  }
}

export { makeImgConfig }
