import React from "react"
import {
  styled,
  Container,
  SearchInput,
  Pagination,
  Card,
  CardContent,
  Grid,
  Skeleton,
} from "ol-components"
import { MetaTags } from "ol-utilities"

import { ResourceTypeEnum } from "api"
import type { LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as LRSearchRequest } from "api"
import { useLearningResourcesSearch } from "api/hooks/learningResources"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import { useSearchQueryParams, FacetDisplay } from "@mitodl/course-search-utils"
import type { FacetManifest } from "@mitodl/course-search-utils"
import { useSearchParams } from "@mitodl/course-search-utils/react-router"
import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"
import PlainVerticalList from "@/components/PlainVerticalList/PlainVerticalList"

import { ResourceTypeTabs } from "./ResourceTypeTabs"
import type { TabConfig } from "./ResourceTypeTabs"

const RESOURCE_FACETS: FacetManifest = [
  {
    name: "topic",
    title: "Topics",
    useFilterableFacet: true,
    expandedOnLoad: true,
  },
]

const AGGREGATIONS: LRSearchRequest["aggregations"] = ["resource_type", "topic"]

const ColoredHeader = styled.div`
  background-color: ${({ theme }) => theme.palette.secondary.light};
  height: 150px;
  display: flex;
  align-items: center;
`
const SearchField = styled(SearchInput)`
  background-color: ${({ theme }) => theme.custom.colorBackgroundLight};
  width: 100%;
`

const FacetStyles = styled.div`
  * {
    color: ${({ theme }) => theme.palette.secondary.main};
  }

  input[type="checkbox"] {
    accent-color: ${({ theme }) => theme.palette.primary.main};
  }

  .filter-section-main-title {
    font-size: ${({ theme }) => theme.custom.fontLg};
    font-weight: bold;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
  }

  .filter-section-button {
    font-size: ${({ theme }) => theme.custom.fontLg};
    font-weight: 600;
    padding-left: 0;
    background-color: transparent;
    display: flex;
    justify-content: space-between;
    width: 100%;
    border: none;
    cursor: pointer;
  }

  .facets {
    box-sizing: border-box;
    background-color: ${({ theme }) => theme.custom.colorBackgroundLight};
    border-radius: 4px;
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
      color: ${({ theme }) => theme.palette.secondary.main};
      font-size: ${({ theme }) => theme.custom.fontSm};
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
    background-color: ${({ theme }) => theme.custom.colorBackgroundLight};
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
    cursor: pointer;
  }
`
const PaginationContainer = styled.div`
  display: flex;
  justify-content: end;
`

const PAGE_SIZE = 10
const MAX_PAGE = 50
const getLastPage = (count: number): number => {
  const pages = Math.ceil(count / PAGE_SIZE)
  return pages > MAX_PAGE ? MAX_PAGE : pages
}

const TABS: TabConfig[] = [
  {
    label: "Courses",
    resource_type: ResourceTypeEnum.Course,
  },
  {
    label: "Podcasts",
    resource_type: ResourceTypeEnum.Podcast,
  },
  {
    label: "Programs",
    resource_type: ResourceTypeEnum.Program,
  },
]
const ALL_RESOURCE_TABS = TABS.map((t) => t.resource_type)

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

  const resourceType = params.activeFacets.resource_type
  const { data, isFetching } = useLearningResourcesSearch(
    {
      aggregations: AGGREGATIONS,
      q: params.queryText,
      resource_type: resourceType ? resourceType : ALL_RESOURCE_TABS,
      topic: params.activeFacets.topic,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    },
    { keepPreviousData: true },
  )

  const resultsTitle = params.queryText
    ? `${data?.count} results for "${params.queryText}"`
    : `${data?.count} results`

  return (
    <>
      <MetaTags>
        <title>Search</title>
      </MetaTags>
      <ColoredHeader>
        <Container>
          <GridContainer>
            <GridColumn variant="sidebar-2-wide-main"></GridColumn>
            <Grid item xs={12} md={6} container alignItems="center">
              <SearchField
                color="secondary"
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                onSubmit={(e) => setCurrentTextAndQuery(e.target.value)}
                onClear={() => setCurrentText("")}
                placeholder="Search for resources"
              />
            </Grid>
          </GridContainer>
        </Container>
      </ColoredHeader>
      <Container>
        <GridContainer>
          <ResourceTypeTabs.Context
            resourceType={params.activeFacets.resource_type?.[0]}
          >
            <GridColumn variant="sidebar-2-wide-main" />
            <GridColumn variant="main-2-wide-main">
              <h3>{isFetching ? <Skeleton width="50%" /> : resultsTitle}</h3>
            </GridColumn>
            <GridColumn variant="sidebar-2-wide-main" />
            <GridColumn variant="main-2-wide-main">
              <ResourceTypeTabs.TabList
                clearFacet={clearFacet}
                setFacetActive={setFacetActive}
                tabs={TABS}
                aggregations={data?.metadata.aggregations}
                onTabChange={() => setPage(1)}
              />
            </GridColumn>
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
              <ResourceTypeTabs.TabPanels tabs={TABS}>
                {data && data.count > 0 ? (
                  <PlainVerticalList itemSpacing="16px">
                    {data.results.map((resource) => (
                      <li key={resource.id}>
                        <LearningResourceCard
                          variant="row-reverse"
                          resource={resource}
                        />
                      </li>
                    ))}
                  </PlainVerticalList>
                ) : (
                  <Card>
                    <CardContent>No results found for your query.</CardContent>
                  </Card>
                )}
                <PaginationContainer>
                  <Pagination
                    count={getLastPage(data?.count ?? 0)}
                    page={page}
                    onChange={(_, newPage) => setPage(newPage)}
                  />
                </PaginationContainer>
              </ResourceTypeTabs.TabPanels>
            </GridColumn>
          </ResourceTypeTabs.Context>
        </GridContainer>
      </Container>
    </>
  )
}

export default SearchPage
