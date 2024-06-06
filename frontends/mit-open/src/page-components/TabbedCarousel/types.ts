import type {
  LearningResourcesApiLearningResourcesListRequest as LRListRequest,
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as SearchRequest,
  FeaturedApiFeaturedListRequest as FeaturedListParams,
} from "api"

interface ResourceDataSource {
  type: "resources"
  params: LRListRequest
}

interface SearchDataSource {
  type: "lr_search"
  params: SearchRequest
}

interface FeaturedDataSource {
  type: "lr_featured"
  params: FeaturedListParams
}

type TabConfig = {
  label: React.ReactNode
  pageSize: number
  size?: "small" | "medium"
  data: ResourceDataSource | SearchDataSource | FeaturedDataSource
}

export type {
  TabConfig,
  ResourceDataSource,
  SearchDataSource,
  FeaturedDataSource,
}
