import { faker } from "@faker-js/faker/locale/en"
import type { PartialDeep } from "type-fest"

export type Factory<T, U = never> = (overrides?: Partial<T>, options?: U) => T
export type PartialFactory<T, U = T> = (overrides?: PartialDeep<T>) => U

interface PaginatedResult<T> {
  count: number
  next: null | string
  previous: null | string
  results: T[]
}

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
    const results = Array.from({ length: pageSize ?? count }, () =>
      makeResult(),
    )
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
