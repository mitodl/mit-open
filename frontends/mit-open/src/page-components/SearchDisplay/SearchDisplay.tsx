import React, { useMemo } from "react"
import {
  styled,
  Pagination,
  MuiCard,
  CardContent,
  PlainList,
  Skeleton,
  Container,
  Typography,
  Button,
  SimpleSelect,
  truncateText,
  css,
} from "ol-components"

import TuneIcon from "@mui/icons-material/Tune"

import {
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as LRSearchRequest,
  ResourceTypeEnum,
} from "api"
import { useLearningResourcesSearch } from "api/hooks/learningResources"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import {
  AvailableFacets,
  UseResourceSearchParamsProps,
  UseResourceSearchParamsResult,
} from "@mitodl/course-search-utils"
import type {
  Facets,
  BooleanFacets,
  FacetManifest,
} from "@mitodl/course-search-utils"
import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"
import _ from "lodash"

import { ResourceTypeTabs } from "./ResourceTypeTabs"
import ProfessionalToggle from "./ProfessionalToggle"

import type { TabConfig } from "./ResourceTypeTabs"

export const StyledDropdown = styled(SimpleSelect)`
  margin: 8px;
  margin-top: 22px;
  min-width: 180px;
  border-radius: 24px;
  background: ${({ theme }) => theme.custom.colors.white};
`

export const StyledResourceTabs = styled(ResourceTypeTabs.TabList)`
  margin-top: 20px;

  div div button {
    text-align: center;
    font-size: 14px;
    line-height: 20px;
    text-transform: none;
  }
`

export const SortContainer = styled.div`
  ${({ theme }) => theme.breakpoints.up("sm")} {
    float: right;
    padding-right: 12px;
  }
`
export const FacetStyles = styled.div`
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

export const FilterTitle = styled.div`
  margin-right: 1rem;
  display: flex;
  align-items: center;

  .MuiSvgIcon-root {
    margin-left: 0.5rem;
  }
`

export const FacetsTitleContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  min-height: 65px;
  align-items: end;
  padding-bottom: 10px;
  padding-top: 20px;
  ${({ theme }) => theme.breakpoints.up("sm")} {
    min-height: 83px;
  }
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

export const TABS: TabConfig[] = [
  {
    label: "Courses",
    resource_type: ResourceTypeEnum.Course,
  },
  {
    label: "Programs",
    resource_type: ResourceTypeEnum.Program,
  },
  {
    label: "Videos",
    resource_type: ResourceTypeEnum.Video,
  },
  {
    label: "Podcasts",
    resource_type: ResourceTypeEnum.Podcast,
  },
]
export const ALL_RESOURCE_TABS = TABS.map((t) => t.resource_type)

export const SORT_OPTIONS = [
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

interface SearchDisplayProps {
  page: number
  setPage: (newPage: number) => void
  facetManifest: FacetManifest
  facetNames: UseResourceSearchParamsProps["facets"]
  constantSearchParams: Facets & BooleanFacets
  hasFacets: UseResourceSearchParamsResult["hasFacets"]
  requestParams: UseResourceSearchParamsResult["params"]
  setParamValue: UseResourceSearchParamsResult["setParamValue"]
  clearAllFacets: UseResourceSearchParamsResult["clearAllFacets"]
  toggleParamValue: UseResourceSearchParamsResult["toggleParamValue"]
  patchParams: UseResourceSearchParamsResult["patchParams"]
}

const SearchDisplay: React.FC<SearchDisplayProps> = ({
  page,
  setPage,
  facetManifest,
  facetNames,
  constantSearchParams,
  hasFacets,
  requestParams,
  setParamValue,
  clearAllFacets,
  toggleParamValue,
  patchParams,
}) => {
  const allParams = useMemo(() => {
    return { ...constantSearchParams, ...requestParams }
  }, [requestParams, constantSearchParams])

  const { data, isLoading } = useLearningResourcesSearch(
    {
      ...(allParams as LRSearchRequest),
      aggregations: facetNames as LRSearchRequest["aggregations"],
      offset: (page - 1) * PAGE_SIZE,
    },
    { keepPreviousData: true },
  )
  return (
    <Container>
      <GridContainer>
        <ResourceTypeTabs.Context
          resourceType={requestParams.resource_type?.[0]}
        >
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
              <ProfessionalToggle
                professionalSetting={requestParams.professional}
                setParamValue={setParamValue}
              ></ProfessionalToggle>
              <AvailableFacets
                facetManifest={facetManifest}
                activeFacets={requestParams}
                onFacetChange={toggleParamValue}
                facetOptions={data?.metadata.aggregations ?? {}}
              />
            </FacetStyles>
          </GridColumn>
          <GridColumn variant="main-2-wide-main">
            <SortContainer>
              <StyledDropdown
                initialValue={requestParams.sortby || ""}
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
            <StyledResourceTabs
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
                <MuiCard>
                  <CardContent>No results found for your query.</CardContent>
                </MuiCard>
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
  )
}

export default SearchDisplay
