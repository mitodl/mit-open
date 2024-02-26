import React from "react"
import { useSearchParams } from "react-router-dom"
import { BannerPage, Container } from "ol-components"

import { MetaTags } from "ol-utilities"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import {
  FacetDisplay,
  getDepartmentName,
  getLevelName,
  useSearchQueryParams,
  useInfiniteSearch,
} from "@mitodl/course-search-utils"
import type {
  FacetManifest,
  UseInfiniteSearchProps,
} from "@mitodl/course-search-utils"
import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"
import InfiniteScroll from "react-infinite-scroller"

const RESOURCE_FACETS: FacetManifest = [
  {
    name: "department",
    title: "Departments",
    useFilterableFacet: true,
    expandedOnLoad: true,
    labelFunction: getDepartmentName,
  },
  {
    name: "level",
    title: "Level",
    useFilterableFacet: false,
    expandedOnLoad: false,
    labelFunction: getLevelName,
  },
  {
    name: "topic",
    title: "Topics",
    useFilterableFacet: true,
    expandedOnLoad: false,
  },
  {
    name: "course_feature",
    title: "Features",
    useFilterableFacet: true,
    expandedOnLoad: false,
  },
]

const AGGREGATIONS: UseInfiniteSearchProps["aggregations"] = {
  resources: ["department", "level", "topic", "course_feature"],
  content_files: ["topic", "platform", "offered_by", "content_feature_type"],
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { params, setFacetActive, clearFacets } = useSearchQueryParams({
    searchParams,
    setSearchParams,
  })

  const { pages, hasNextPage, fetchNextPage } = useInfiniteSearch({
    params,
    baseUrl: "http://localhost:8063/",
    aggregations: AGGREGATIONS,
    keepPreviousData: true,
  })
  const aggregations = pages[0]?.metadata?.aggregations ?? {}

  return (
    <BannerPage
      src="/static/images/course_search_banner.png"
      alt=""
      className="learningpaths-page"
    >
      <MetaTags>
        <title>Search</title>
      </MetaTags>
      <Container>
        <GridContainer>
          <GridColumn variant="sidebar-2-wide-main">
            <FacetDisplay
              facetMap={RESOURCE_FACETS}
              activeFacets={params.activeFacets}
              facetOptions={(group) => aggregations[group] ?? []}
              onUpdateFacets={(e) => {
                setFacetActive(e.target.name, e.target.value, e.target.checked)
              }}
              clearAllFilters={clearFacets}
              toggleFacet={setFacetActive}
            />
          </GridColumn>
          <GridColumn variant="main-2-wide-main">
            <InfiniteScroll
              hasMore={hasNextPage}
              loadMore={fetchNextPage}
              initialLoad={false}
            >
              {pages
                .flatMap((page) => page.results)
                .map((resource) => {
                  return (
                    <LearningResourceCard
                      variant="row"
                      key={resource.id}
                      resource={resource}
                    />
                  )
                })}
            </InfiniteScroll>
          </GridColumn>
        </GridContainer>
      </Container>
    </BannerPage>
  )
}

export default SearchPage
