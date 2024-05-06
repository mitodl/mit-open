import type { PercolateQuery } from "../../generated/v1"
import { makePaginatedFactory } from "ol-test-utilities"
const percolateQuery: Factory<PercolateQuery> = (overrides = {}) => ({
  ...overrides,
})

const percolateQueryList = makePaginatedFactory(percolateQuery)

export { percolateQuery, percolateQueryList }
