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
import {
  useSearchQueryParams,
  FacetDisplay,
  getDepartmentName,
  getLevelName,
} from "@mitodl/course-search-utils"
import type { FacetManifest } from "@mitodl/course-search-utils"
import { useSearchParams } from "@mitodl/course-search-utils/react-router"
import { ResourceTypeEnum } from "api"
import type {
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as LRSearchRequest,
  LearningResourceSearchResponse,
} from "api"
import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"
import { useLearningResourcesSearch } from "api/hooks/learningResources"
import PlainVerticalList from "@/components/PlainVerticalList/PlainVerticalList"

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

const FacetStyles = styled.div`
  margin-top: 72px;

  * {
    color: ${({ theme }) => theme.palette.secondary.main};
  }

  input[type="checkbox"] {
    accent-color: ${({ theme }) => theme.palette.primary.main};
  }

  .filter-section-main-title {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
  }

  .filter-section-button {
    font-size: 1.25rem;
    font-weight: 600;
    padding-left: 0px;
    background-color: transparent;
    display: flex;
    justify-content: space-between;
    width: 100%;
    border: none;
    cursor: pointer;
  }

  .facets {
    box-sizing: border-box;
    background-color: white;
    border-radius: 12px;
    padding: 1rem;
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;

    .facet-visible {
      display: flex;
      flex-direction: row;
      align-items: center;
      height: 25px;
      font-size: 0.875em;

      input,
      label {
        cursor: pointer;
      }

      input[type="checkbox"] {
        margin-left: 4px;
        margin-right: 10px;
      }

      .facet-count {
        color: ${({ theme }) => theme.palette.text.secondary};
      }
    }

    .facet-more-less {
      cursor: pointer;
      color: gray;
      font-size: 0.875em;
      text-align: right;
    }
  }

  .filterable-facet {
    .facet-list {
      max-height: 400px;
      overflow: auto;
      padding-right: 0.5rem;
    }

    .input-wrapper {
      position: relative;
      .input-postfix-icon {
        display: none;
      }
      .input-postfix-button {
        cursor: pointer;
        position: absolute;
        right: 5px;
        top: 50%;
        transform: translateY(-50%);
        border: none;
        background: none;
        padding: 0;
      }
    }
  }

  .facet-label {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }

  input.facet-filter {
    background-color: initial;
    border-radius: 0;
    border: 1px solid ${({ theme }) => theme.custom.inputBorderGrey};
    padding: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
    width: 100%;
  }

  .active-search-filter {
    margin-right: 6px;
    margin-bottom: 9px;
    padding-left: 8px;

    background-color: white;
    font-size: ${({ theme }) => theme.custom.fontSm};
    display: inline-flex;
    align-items: center;
    flex-wrap: nowrap;
    border: 1px solid ${({ theme }) => theme.custom.inputBorderGrey};
    border-radius: 14px;

    .remove-filter-button {
      padding: 4px;
      margin-right: 4px;

      display: flex;
      align-items: center;

      cursor: pointer;
      border: none;
      background: none;
      .material-icons {
        font-size: 1.25em;
      }
    }
  }

  .clear-all-filters-button {
    font-size: ${({ theme }) => theme.custom.fontNormal};
    font-weight: normal;
    text-decoration: underline;
    background: none;
    border: none;
  }
`

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const {
    params,
    setFacetActive,
    clearFacet,
    clearFacets,
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

  const renderedResults = (
    <>
      <PlainVerticalList itemSpacing="16px">
        {data?.results.map((resource) => (
          <li key={resource.id}>
            <LearningResourceCard variant="row-reverse" resource={resource} />
          </li>
        ))}
      </PlainVerticalList>
      <Pagination
        count={getLastPage(data?.count ?? 0)}
        page={page}
        onChange={(_, newPage) => setPage(newPage)}
      />
    </>
  )

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
            <FacetStyles>
              <FacetDisplay
                facetMap={RESOURCE_FACETS}
                activeFacets={params.activeFacets}
                onFacetChange={setFacetActive}
                clearAllFilters={clearFacets}
                facetOptions={(group) =>
                  data?.metadata.aggregations[group] ?? null
                }
              />
            </FacetStyles>
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
          </GridColumn>
        </GridContainer>
      </Container>
    </>
  )
}

export default SearchPage
