import { SourceTypeEnum, type PercolateQuery } from "../../generated/v1"
import { makePaginatedFactory, type Factory } from "ol-test-utilities"
import { faker } from "@faker-js/faker/locale/en"
const percolateQuery: Factory<PercolateQuery> = (overrides = {}) => {
  const percolateQuery: PercolateQuery = {
    id: faker.helpers.unique(faker.datatype.number),
    original_query: {},
    query: {},
    users: [],
    source_type: SourceTypeEnum.SearchSubscriptionType,
    ...overrides,
  }
  return percolateQuery
}

const percolateQueryList = makePaginatedFactory(percolateQuery)

export { percolateQuery, percolateQueryList }
