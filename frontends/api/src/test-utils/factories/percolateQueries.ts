import { SourceTypeEnum, type PercolateQuery } from "../../generated/v1"
import { type Factory, makePaginatedFactory } from "ol-test-utilities"
import { faker } from "@faker-js/faker/locale/en"
import { UniqueEnforcer } from "enforce-unique"
const uniqueEnforcerId = new UniqueEnforcer()
const percolateQuery: Factory<PercolateQuery> = (overrides = {}) => {
  const percolateQuery: PercolateQuery = {
    id: uniqueEnforcerId.enforce(() => faker.number.int()),
    original_query: {},
    query: {},
    source_type: SourceTypeEnum.SearchSubscriptionType,
    source_description: "",
    source_label: "",
    ...overrides,
  }
  return percolateQuery
}

const percolateQueryList = makePaginatedFactory(percolateQuery)

export { percolateQuery, percolateQueryList }
