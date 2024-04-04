import type {
  LearningResourcesApiLearningResourcesListRequest as LRListRequest,
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as SearchRequest,
  LearningResourcesApiLearningResourcesUpcomingListRequest as LRUpcomingListRequest,
} from "api"

interface ResourceDataSource {
  type: "resources"
  params: LRListRequest
}

interface UpcomingDataSource {
  type: "resources_upcoming"
  params: LRUpcomingListRequest
}

interface SearchDataSource {
  type: "lr_search"
  params: SearchRequest
}

type TabConfig = {
  label: React.ReactNode
  pageSize: number
  data: ResourceDataSource | SearchDataSource | UpcomingDataSource
}

export type {
  TabConfig,
  ResourceDataSource,
  SearchDataSource,
  UpcomingDataSource,
}
