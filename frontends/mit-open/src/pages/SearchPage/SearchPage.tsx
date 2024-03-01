import React from "react"
import {
  styled,
  Container,
  SearchInput,
  Pagination,
  Tab,
  TabContext,
  TabList,
  TabPanel,
} from "ol-components"

import { MetaTags } from "ol-utilities"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import { useSearchQueryParams } from "@mitodl/course-search-utils"
import { useSearchParams } from "@mitodl/course-search-utils/react-router"
import { ResourceTypeEnum } from "api"
import type {
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as LRSearchRequest,
  LearningResourceSearchResponse,
} from "api"
import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"
import { useLearningResourcesSearch } from "api/hooks/learningResources"

const AGGREGATIONS: LRSearchRequest["aggregations"] = [
  "resource_type",
  "level",
  "department",
  "topic",
]

const ColoredHeader = styled.div`
  background-color: ${({ theme }) => theme.palette.secondary.light};
  height: 150px;
`
const SearchField = styled(SearchInput)`
  background-color: white;
  width: 66%;
`

const PAGE_SIZE = 10
const MAX_PAGE = 50
const getLastPage = (count: number): number => {
  const pages = Math.ceil(count / PAGE_SIZE)
  return pages > MAX_PAGE ? MAX_PAGE : pages
}

const resourceTypeCounts = (response: LearningResourceSearchResponse) => {
  const buckets = response.metadata.aggregations?.resource_type ?? []
  const counts = buckets.reduce(
    (acc, bucket) => {
      acc[bucket.key] = bucket.doc_count
      return acc
    },
    {} as Record<string, number>,
  )
  counts["all"] = Object.values(counts).reduce((acc, count) => acc + count, 0)
  Object.values(ResourceTypeEnum).forEach((value) => {
    if (!counts[value]) {
      counts[value] = 0
    }
  })
  return counts
}
const withCount = (label: string, count?: number) => {
  if (count === undefined) {
    return label
  }
  return `${label} (${count})`
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const {
    params,
    setFacetActive,
    clearFacet,
    currentText,
    setCurrentText,
    setCurrentTextAndQuery,
  } = useSearchQueryParams({
    searchParams,
    setSearchParams,
  })
  const page = +(searchParams.get("page") ?? "1")

  const setPage = (newPage: number) => {
    setSearchParams((current) => {
      const copy = new URLSearchParams(current)
      copy.set("page", newPage.toString())
      return copy
    })
  }

  const { data } = useLearningResourcesSearch(
    {
      aggregations: AGGREGATIONS,
      q: params.queryText,
      resource_type: params.activeFacets.resource_type,
      department: params.activeFacets.department,
      level: params.activeFacets.level,
      topic: params.activeFacets.topic,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    },
    { keepPreviousData: true },
  )

  const counts = data ? resourceTypeCounts(data) : {}
  const tabLabels = {
    all: withCount("All", counts.all),
    course: withCount("Courses", counts.course),
    program: withCount("Programs", counts.program),
    podcast: withCount("Podcast", counts.podcast),
  }
  const tab = params.activeFacets.resource_type?.[0] ?? "all"

  const renderedResults = data?.results.map((resource) => (
    <LearningResourceCard
      variant="row-reverse"
      key={resource.id}
      resource={resource}
    />
  ))

  return (
    <>
      <MetaTags>
        <title>Search</title>
      </MetaTags>
      <ColoredHeader>
        <Container sx={{ height: "100%" }}>
          <GridContainer sx={{ height: "100%" }}>
            <GridColumn variant="sidebar-2-wide-main"></GridColumn>
            <GridColumn
              variant="main-2-wide-main"
              sx={{ height: "100%" }}
              container
              alignItems="center"
            >
              <SearchField
                color="secondary"
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                onSubmit={(e) => setCurrentTextAndQuery(e.target.value)}
                onClear={() => setCurrentText("")}
                placeholder="Search for resources"
              />
            </GridColumn>
          </GridContainer>
        </Container>
      </ColoredHeader>
      <Container>
        <GridContainer>
          <GridColumn variant="sidebar-2-wide-main">
            {/* Facets go here */}
          </GridColumn>
          <GridColumn variant="main-2-wide-main">
            <TabContext value={tab}>
              <TabList
                onChange={(_e, value) => {
                  setPage(1)
                  clearFacet("resource_type")
                  if (value !== "all") {
                    setFacetActive("resource_type", value, true)
                  }
                }}
              >
                <Tab value="all" label={tabLabels.all} />
                <Tab value="course" label={tabLabels.course} />
                <Tab value="program" label={tabLabels.program} />
                <Tab value="podcast" label={tabLabels.podcast} />
              </TabList>
              <TabPanel value="all">{renderedResults}</TabPanel>
              <TabPanel value="course">{renderedResults}</TabPanel>
              <TabPanel value="program">{renderedResults}</TabPanel>
              <TabPanel value="podcast">{renderedResults}</TabPanel>
            </TabContext>
            <Pagination
              count={getLastPage(data?.count ?? 0)}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
            />
          </GridColumn>
        </GridContainer>
      </Container>
    </>
  )
}

export default SearchPage
