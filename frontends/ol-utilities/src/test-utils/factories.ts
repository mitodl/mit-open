import { faker } from "@faker-js/faker/locale/en"
import type { Factory } from "ol-test-utilities"
import type { EmbedlyConfig } from "../learning-resources/learning-resources"

export const makeImgConfig: Factory<EmbedlyConfig> = (overrides) => {
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
