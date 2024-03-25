import React, { useCallback } from "react"
import {
  styled,
  Container,
  SearchInput,
  Pagination,
  Card,
  CardContent,
  Grid,
  Stack,
  Button,
} from "ol-components"
import { MetaTags } from "ol-utilities"

import { ResourceTypeEnum } from "api"
import type {
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as LRSearchRequest,
  LearningResourceSearchResponse,
} from "api"
import { useLearningResourcesSearch } from "api/hooks/learningResources"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import {
  AvailableFacets,
  useResourceSearchParams,
  UseResourceSearchParamsProps,
} from "@mitodl/course-search-utils"
import type { FacetManifest } from "@mitodl/course-search-utils"
import { useSearchParams } from "@mitodl/course-search-utils/react-router"
import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"
import CardRowList from "@/components/CardRowList/CardRowList"
import TuneIcon from "@mui/icons-material/Tune"

import { ResourceTypeTabs } from "./ResourceTypeTabs"
import type { TabConfig } from "./ResourceTypeTabs"

const FACET_MANIFEST: FacetManifest = [
  {
    name: "topic",
    title: "Topics",
    useFilterableFacet: true,
    expandedOnLoad: true,
  },
  {
    name: "offered_by",
    title: "Offered By",
    useFilterableFacet: false,
    expandedOnLoad: true,
  },
]
const FACET_NAMES = FACET_MANIFEST.map(
  (f) => f.name,
) as UseResourceSearchParamsProps["facets"]

const AGGREGATIONS: LRSearchRequest["aggregations"] = [
  "resource_type",
  "topic",
  "offered_by",
]

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

  margin-top: 24px;

  input[type="checkbox"] {
    accent-color: ${({ theme }) => theme.palette.primary.main};
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
`

const FilterTitle = styled.div`
  font-size: ${({ theme }) => theme.custom.fontLg};
  font-weight: ${({ theme }) => theme.typography.fontWeightBold};
  margin-right: 1rem;
  display: flex;
  align-items: center;

  .MuiSvgIcon-root {
    margin-left: 0.5rem;
  }
`

const FacetsTitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 48px;
  justify-content: end;
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

/**
 * Augment the facet buckets for `groupKey` with active values that have no
 * results.
 */
const includeActiveZerosInBuckets = (
  groupKey: string,
  aggregations: LearningResourceSearchResponse["metadata"]["aggregations"],
  params: LRSearchRequest,
) => {
  const opts = [...(aggregations[groupKey] ?? [])]
  const active = params[groupKey as keyof LRSearchRequest] ?? []
  const actives = Array.isArray(active) ? active : [active]
  actives.forEach((key) => {
    if (!opts.find((o) => o.key === key)) {
      opts.push({ key: String(key), doc_count: 0 })
    }
  })
  return opts
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const setPage = useCallback(
    (newPage: number) => {
      setSearchParams((current) => {
        const copy = new URLSearchParams(current)
        if (newPage === 1) {
          copy.delete("page")
        } else {
          copy.set("page", newPage.toString())
        }
        return copy
      })
    },
    [setSearchParams],
  )

  const onFacetsChange = useCallback(() => {
    setPage(1)
  }, [setPage])
  const {
    params,
    clearAllFacets,
    patchParams,
    toggleParamValue,
    currentText,
    setCurrentText,
    setCurrentTextAndQuery,
  } = useResourceSearchParams({
    searchParams,
    setSearchParams,
    facets: FACET_NAMES,
    onFacetsChange,
  })
  const page = +(searchParams.get("page") ?? "1")

  const resourceType = params.resource_type

  const { data } = useLearningResourcesSearch(
    {
      ...params,
      aggregations: AGGREGATIONS,
      resource_type: resourceType ? resourceType : ALL_RESOURCE_TABS,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    },
    { keepPreviousData: true },
  )

  const getFacetOptions = useCallback(
    (groupKey: string) => {
      return includeActiveZerosInBuckets(
        groupKey,
        data?.metadata.aggregations ?? {},
        params,
      )
    },
    [params, data?.metadata.aggregations],
  )

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
                onSubmit={(e) => {
                  setCurrentTextAndQuery(e.target.value)
                }}
                onClear={() => {
                  setCurrentTextAndQuery("")
                }}
                placeholder="Search for resources"
              />
            </Grid>
          </GridContainer>
        </Container>
      </ColoredHeader>
      <Container>
        <GridContainer>
          <ResourceTypeTabs.Context resourceType={params.resource_type?.[0]}>
            <GridColumn variant="sidebar-2-wide-main">
              <FacetsTitleContainer>
                <Stack
                  direction="row"
                  alignItems="baseline"
                  justifyContent="space-between"
                >
                  <FilterTitle>
                    Filters
                    <TuneIcon fontSize="inherit" />
                  </FilterTitle>
                  <Button
                    variant="text"
                    onClick={clearAllFacets}
                    color="secondary"
                    sx={{ padding: 0, lineHeight: "normal" }}
                  >
                    Clear all
                  </Button>
                </Stack>
              </FacetsTitleContainer>
              <FacetStyles>
                <AvailableFacets
                  facetMap={FACET_MANIFEST}
                  activeFacets={params}
                  onFacetChange={toggleParamValue}
                  facetOptions={getFacetOptions}
                />
              </FacetStyles>
            </GridColumn>
            <GridColumn variant="main-2-wide-main">
              <ResourceTypeTabs.TabList
                patchParams={patchParams}
                tabs={TABS}
                aggregations={data?.metadata.aggregations}
                onTabChange={() => setPage(1)}
              />
              <ResourceTypeTabs.TabPanels tabs={TABS}>
                {data && data.count > 0 ? (
                  <CardRowList marginTop={false}>
                    {data.results.map((resource) => (
                      <li key={resource.id}>
                        <LearningResourceCard
                          variant="row-reverse"
                          resource={resource}
                        />
                      </li>
                    ))}
                  </CardRowList>
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
