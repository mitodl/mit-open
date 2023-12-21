import { faker } from "@faker-js/faker/locale/en"
import { times } from "lodash"
import type { PartialDeep } from "type-fest"
import type { PaginatedResult } from "./interfaces"
import type { EmbedlyConfig } from "ol-common"

export type Factory<T, U = never> = (overrides?: Partial<T>, options?: U) => T
export type PartialFactory<T, U = T> = (overrides?: PartialDeep<T>) => U

export const makePaginatedFactory =
  <T>(makeResult: Factory<T>) =>
  (
    { count, pageSize }: { count: number; pageSize?: number },
    {
      previous = null,
      next = null,
    }: {
      next?: string | null
      previous?: string | null
    } = {},
  ) => {
    const results = times(pageSize ?? count, () => makeResult())
    return {
      results,
      count,
      next,
      previous,
    } satisfies PaginatedResult<T>
  }

/**
 * Make a random URL with `faker`, but standardize it to what browsers use.
 */
export const makeUrl = (): string => new URL(faker.internet.url()).toString()

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
