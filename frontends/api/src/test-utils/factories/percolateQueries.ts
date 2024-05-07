import { SourceTypeEnum, type PercolateQuery } from "../../generated/v1"
import type { Factory } from "ol-test-utilities"
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

//const percolateQueryList = makePaginatedFactory(percolateQuery)

const percolateQueryList = ({
  count,
  pageSize,
}: {
  count: number
  pageSize?: number
}) => {
  const results: PercolateQuery[] = Array(pageSize ?? count)
    .fill(null)
    .map((_val) => {
      return percolateQuery({})
    })
  return results
}

export { percolateQuery, percolateQueryList }
