import { faker } from "@faker-js/faker/locale/en"
import type { Factory } from "ol-utilities/factories"
import type { EmbedlyConfig } from "ol-common"

const makeImgConfig: Factory<EmbedlyConfig> = (overrides) => {
  const imgConfig = {
    width: faker.datatype.number(),
    height: faker.datatype.number(),
    key: faker.datatype.uuid(),
  }
  return {
    ...imgConfig,
    ...overrides,
  }
}

export { makeImgConfig }
