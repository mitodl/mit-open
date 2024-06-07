import type {
  LearningResourcesApiLearningResourcesListRequest as LRListRequest,
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as SearchRequest,
  FeaturedApiFeaturedListRequest as FeaturedListParams,
} from "api"
import type { CarouselButtonAlignment, ButtonStyleProps } from "ol-components"
import { ReactElement } from "react"

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
  // These don't belong here.
  pageLeftIcon?: ReactElement
  pageRightIcon?: ReactElement
  buttonAlignment?: CarouselButtonAlignment
  buttonVariant?: ButtonStyleProps["variant"]
  buttonSize?: ButtonStyleProps["size"]
}

export type {
  TabConfig,
  ResourceDataSource,
  SearchDataSource,
  FeaturedDataSource,
}
