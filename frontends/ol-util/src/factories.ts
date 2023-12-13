import { faker } from "@faker-js/faker/locale/en"
import type { PaginatedResult } from "./interfaces"
import { times } from "lodash"
import type { PartialDeep } from "type-fest"

type Factory<T, U = never> = (overrides?: Partial<T>, options?: U) => T
type PartialFactory<T, U = T> = (overrides?: PartialDeep<T>) => U

const makePaginatedFactory =
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
const makeUrl = (): string => new URL(faker.internet.url()).toString()

export { makePaginatedFactory, makeUrl }
export type { Factory, PartialFactory }
