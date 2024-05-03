import type {
  LearningResourcesApiLearningResourcesListRequest as LRListRequest,
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as SearchRequest,
} from "api"

interface ResourceDataSource {
  type: "resources"
  params: LRListRequest
}

interface SearchDataSource {
  type: "lr_search"
  params: SearchRequest
}

type TabConfig = {
  label: React.ReactNode
  pageSize: number
  data: ResourceDataSource | SearchDataSource
}

export type { TabConfig, ResourceDataSource, SearchDataSource }
