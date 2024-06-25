import type {
  LearningResourcesApiLearningResourcesListRequest as LRListRequest,
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as SearchRequest,
  FeaturedApiFeaturedListRequest as FeaturedListParams,
} from "api"

type CardProps = {
  size?: "small" | "medium"
}

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

type DataSource = ResourceDataSource | SearchDataSource | FeaturedDataSource

type TabConfig<D extends DataSource = DataSource> = {
  label: React.ReactNode
  cardProps?: CardProps
  data: D
  eager?: boolean
}

export type {
  TabConfig,
  ResourceDataSource,
  SearchDataSource,
  FeaturedDataSource,
  DataSource,
}
