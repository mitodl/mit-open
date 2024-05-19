import React, { useCallback, useMemo } from "react"
import {
  styled,
  Container,
  SearchInput,
  Pagination,
  Card,
  CardContent,
  Grid,
  Button,
  Typography,
  PlainList,
  Skeleton,
  SimpleSelect,
  truncateText,
  css,
} from "ol-components"
import { MetaTags, capitalize } from "ol-utilities"

import { ResourceTypeEnum } from "api"
import type {
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as LRSearchRequest,
  LearningResourceOfferor,
} from "api"
import {
  useLearningResourcesSearch,
  useOfferorsList,
} from "api/hooks/learningResources"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import {
  AvailableFacets,
  useResourceSearchParams,
  UseResourceSearchParamsProps,
} from "@mitodl/course-search-utils"
import type { FacetManifest } from "@mitodl/course-search-utils"
import { useSearchParams } from "@mitodl/course-search-utils/react-router"
import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"
import TuneIcon from "@mui/icons-material/Tune"

import { ResourceTypeTabs } from "./ResourceTypeTabs"
import type { TabConfig } from "./ResourceTypeTabs"
import _ from "lodash"

const getFacetManifest = (
  offerors: Record<string, LearningResourceOfferor>,
): FacetManifest => {
  return [
    {
      type: "group",
      facets: [
        {
          value: true,
          name: "free",
          label: "Free Courses",
        },
        {
          value: true,
          name: "certification",
          label: "With Certificate",
        },
        {
          value: true,
          name: "professional",
          label: "Professional Courses",
        },
      ],
    },
    {
      name: "topic",
      title: "Topics",
      type: "filterable",
      expandedOnLoad: true,
    },
    {
      name: "offered_by",
      title: "Offered By",
      type: "filterable",
      expandedOnLoad: true,
      labelFunction: (key) => offerors[key]?.name ?? key,
    },
    {
      name: "learning_format",
      title: "Format",
      type: "filterable",
      expandedOnLoad: true,
      labelFunction: (key) =>
        key
          .split("_")
          .map((word) => capitalize(word))
          .join("-"),
    },
  ]
}

const FACET_NAMES = getFacetManifest({}).flatMap((config) => {
  if (config.type === "group") {
    return config.facets.map((f) => f.name)
  }
  return config.name
}) as UseResourceSearchParamsProps["facets"]

const AGGREGATIONS: LRSearchRequest["aggregations"] = [
  "resource_type",
  "learning_format",
  "topic",
  "offered_by",
  "certification",
  "free",
  "professional",
]

const SORT_OPTIONS = [
  {
    label: "Relevance",
    key: "",
  },
  {
    label: "New",
    key: "new",
  },
  {
    label: "Popular",
    key: "-views",
  },
  {
    label: "Upcoming",
    key: "upcoming",
  },
]

const ColoredHeader = styled.div`
  background-color: #394357;
  height: 150px;
  display: flex;
  align-items: center;
`
const SearchField = styled(SearchInput)`
  background-color: ${({ theme }) => theme.custom.colors.white};
  width: 100%;
`

export const StyledDropdown = styled(SimpleSelect)`
  margin: 8px;
  min-width: 140px;
`

const SortContainer = styled.div`
  ${({ theme }) => theme.breakpoints.up("sm")} {
    float: right;
    padding-right: 12px;
  }
`
const FacetStyles = styled.div`
  * {
    color: ${({ theme }) => theme.palette.secondary.main};
  }

  margin-top: 8px;

  input[type="checkbox"] {
    accent-color: ${({ theme }) => theme.palette.primary.main};
  }

  .filter-section-button {
    ${({ theme }) => css({ ...theme.typography.subtitle1 })};
    padding-left: 0;
    background-color: transparent;
    display: flex;
    justify-content: space-between;
    width: 100%;
    border: none;
    cursor: pointer;
  }

  .facet-label {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;

    label {
      ${truncateText(1)};
    }
  }

  .facets {
    box-sizing: border-box;
    background-color: ${({ theme }) => theme.custom.colors.white};
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
      font-size: ${({ theme }) => theme.typography.body2.fontSize};
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

  input.facet-filter {
    background-color: initial;
    border-radius: 0;
    border: 1px solid ${({ theme }) => theme.custom.colors.silverGrayLight};
    padding: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
    width: 100%;
  }
`

const FilterTitle = styled.div`
  margin-right: 1rem;
  display: flex;
  align-items: center;

  .MuiSvgIcon-root {
    margin-left: 0.5rem;
  }
`

const FacetsTitleContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
  min-height: 40px;
  padding-top: 8px;
`

const PaginationContainer = styled.div`
  display: flex;
  justify-content: end;
`

const StyledSkeleton = styled(Skeleton)`
  border-radius: 4px;
`

const PAGE_SIZE = 10
const MAX_PAGE = 50

export const getLastPage = (count: number): number => {
  const pages = Math.ceil(count / PAGE_SIZE)
  return pages > MAX_PAGE ? MAX_PAGE : pages
}

const TABS: TabConfig[] = [
  {
    label: "Courses",
    resource_type: ResourceTypeEnum.Course,
  },
  {
    label: "Programs",
    resource_type: ResourceTypeEnum.Program,
  },
  {
    label: "Podcasts",
    resource_type: ResourceTypeEnum.Podcast,
  },
]
const ALL_RESOURCE_TABS = TABS.map((t) => t.resource_type)

const useFacetManifest = () => {
  const offerorsQuery = useOfferorsList()
  const offerors = useMemo(() => {
    return _.keyBy(offerorsQuery.data?.results ?? [], (o) => o.code)
  }, [offerorsQuery.data?.results])
  const facetManifest = useMemo(() => getFacetManifest(offerors), [offerors])
  return facetManifest
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
  const facetManifest = useFacetManifest()
  const onFacetsChange = useCallback(() => {
    setPage(1)
  }, [setPage])

  const {
    params,
    hasFacets,
    clearAllFacets,
    patchParams,
    toggleParamValue,
    currentText,
    setCurrentText,
    setCurrentTextAndQuery,
    setParamValue,
  } = useResourceSearchParams({
    searchParams,
    setSearchParams,
    facets: FACET_NAMES,
    onFacetsChange,
  })

  const page = +(searchParams.get("page") ?? "1")

  const resourceType = params.resource_type

  const { data, isLoading } = useLearningResourcesSearch(
    {
      ...(params as LRSearchRequest),
      aggregations: AGGREGATIONS,
      resource_type: resourceType ? resourceType : ALL_RESOURCE_TABS,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    },
    { keepPreviousData: true },
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
                <FilterTitle>
                  <Typography variant="h5">Filters</Typography>
                  <TuneIcon fontSize="inherit" />
                </FilterTitle>
                {hasFacets ? (
                  <Button
                    variant="text"
                    color="secondary"
                    size="small"
                    onClick={clearAllFacets}
                  >
                    Clear all
                  </Button>
                ) : null}
              </FacetsTitleContainer>
              <FacetStyles>
                <AvailableFacets
                  facetMap={facetManifest}
                  activeFacets={params}
                  onFacetChange={toggleParamValue}
                  facetOptions={data?.metadata.aggregations ?? {}}
                />
              </FacetStyles>
            </GridColumn>
            <GridColumn variant="main-2-wide-main">
              <SortContainer>
                <StyledDropdown
                  initialValue={params.sortby || ""}
                  isMultiple={false}
                  onChange={(e) => setParamValue("sortby", e.target.value)}
                  options={SORT_OPTIONS}
                  renderValue={(value) => {
                    const opt = SORT_OPTIONS.find(
                      (option) => option.key === value,
                    )
                    return `Sort by: ${opt?.label}`
                  }}
                />
              </SortContainer>
              <ResourceTypeTabs.TabList
                patchParams={patchParams}
                tabs={TABS}
                aggregations={data?.metadata.aggregations}
                onTabChange={() => setPage(1)}
              />
              <ResourceTypeTabs.TabPanels tabs={TABS}>
                {isLoading ? (
                  <PlainList itemSpacing={3}>
                    {Array(PAGE_SIZE)
                      .fill(null)
                      .map((a, index) => (
                        <li key={index}>
                          <StyledSkeleton variant="rectangular" height={162} />
                        </li>
                      ))}
                  </PlainList>
                ) : data && data.count > 0 ? (
                  <PlainList itemSpacing={3}>
                    {data.results.map((resource) => (
                      <li key={resource.id}>
                        <LearningResourceCard
                          variant="row-reverse"
                          resource={resource}
                        />
                      </li>
                    ))}
                  </PlainList>
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
