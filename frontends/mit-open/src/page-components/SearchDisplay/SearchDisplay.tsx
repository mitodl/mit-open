import React, { useMemo } from "react"
import {
  styled,
  Pagination,
  PaginationItem,
  MuiCard,
  CardContent,
  PlainList,
  Container,
  Typography,
  Button,
  SimpleSelect,
  truncateText,
  css,
  Drawer,
} from "ol-components"

import {
  RiCloseLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiEqualizerLine,
} from "@remixicon/react"

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
import _ from "lodash"
import { ResourceTypeTabs } from "./ResourceTypeTabs"
import ProfessionalToggle from "./ProfessionalToggle"
import type { TabConfig } from "./ResourceTypeTabs"

import { ResourceListCard } from "../ResourceCard/ResourceCard"

export const StyledDropdown = styled(SimpleSelect)`
  margin-left: 8px;
  margin-right: 0;
  margin-top: 0;
  min-width: 160px;
  height: 32px;
  background: ${({ theme }) => theme.custom.colors.white};

  svg {
    width: 0.75em;
    height: 0.75em;
  }

  div {
    min-height: 0 px;
    padding-right: 1px !important;
    font-size: 12px !important;
  }
`

export const StyledResourceTabs = styled(ResourceTypeTabs.TabList)`
  margin-top: 0 px;
`

export const DesktopSortContainer = styled.div`
  float: right;

  div {
    height: 32px;
    bottom: 1px;
  }

  ${({ theme }) => theme.breakpoints.down("md")} {
    display: none;
  }
`
export const MobileSortContainer = styled.div`
  float: right;
  ${({ theme }) => theme.breakpoints.up("md")} {
    display: none;
  }

  div {
    height: 32px;
    bottom: -2px;
  }
`

export const FacetStyles = styled.div`
  * {
    color: ${({ theme }) => theme.palette.secondary.main};
  }

  div.facets:last-child {
    border-bottom-right-radius: 8px;
    border-bottom-left-radius: 8px;
    border-bottom: solid 1px ${({ theme }) => theme.custom.colors.lightGray2};
  }

  div.facets:not(.multi-facet-group) {
    border-top-right-radius: 8px;
    border-top-left-radius: 8px;
  }

  div.facets:not(.multi-facet-group) + div.facets:not(.multi-facet-group) {
    border-top-right-radius: 0;
    border-top-left-radius: 0;
  }

  input[type="text"] {
    border: solid 1px ${({ theme }) => theme.custom.colors.lightGray2};
    margin-bottom: 16px;
    margin-top: 12px;
    border-radius: 4px;

    &:focus-visible {
      outline: solid 2px ${({ theme }) => theme.custom.colors.darkGray2};
    }
  }

  .filter-section-button {
    ${({ theme }) => css({ ...theme.typography.subtitle2 })}
    color: ${({ theme }) => theme.custom.colors.darkGray2};
    padding-left: 0;
    background-color: transparent;
    display: flex;
    width: 100%;
    border: none;
    cursor: pointer;
    justify-content: space-between;

    i {
      color: ${({ theme }) => theme.custom.colors.silverGrayLight};
    }
  }

  .facet-label {
    font-size: 14px;
    justify-content: space-between;
    display: flex;
    flex-direction: row;
    width: 100%;

    label {
      ${truncateText(1)};
      color: ${({ theme }) => theme.custom.colors.silverGray};
    }
  }

  .facet-visible {
    margin-top: 4.5px;
    margin-bottom: 4.5px;
  }

  .facet-visible:last-child {
    margin-bottom: 8px;
  }

  .facet-list {
    margin-bottom: 8px;
  }

  .facets {
    box-sizing: border-box;
    background-color: ${({ theme }) => theme.custom.colors.white};
    border: solid 1px ${({ theme }) => theme.custom.colors.lightGray2};
    border-bottom: none;
    padding: 16px;
    padding-left: 24px;
    padding-right: 24px;
    margin-top: 0;
    margin-bottom: 0;

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
        appearance: none;
        display: flex;
        place-content: center;
        font-size: 2rem;
        padding: 0.1rem;
        border: 1px solid ${({ theme }) => theme.custom.colors.silverGrayLight};
        border-radius: 4px;
        margin-left: 4px;
        margin-right: 10px;
        accent-color: ${({ theme }) => theme.custom.colors.silverGrayLight};
        height: 20px;
        width: 24px;
      }

      input[type="checkbox"]:checked {
        appearance: auto;
      }

      .facet-count {
        font-size: 12px;
        padding-left: 3px;
        color: ${({ theme }) => theme.custom.colors.silverGray};
        float: right;
      }
    }

    .facet-more-less {
      cursor: pointer;
      color: ${({ theme }) => theme.palette.text.secondary};
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

        span {
          color: ${({ theme }) => theme.palette.text.secondary};
        }
      }
    }
  }

  input.facet-filter {
    background-color: initial;
    padding: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
    width: 100%;
  }

  .multi-facet-group {
    background: none;
    margin-top: 8px;
    margin-bottom: 8px;
    border-radius: 8px;
    border-bottom: solid 1px ${({ theme }) => theme.custom.colors.lightGray2};
    padding-bottom: 12px;
    padding-top: 10px;

    .facet-visible {
      .facet-label {
        label,
        .facet-count {
          color: black;
        }
      }

      margin-bottom: 0;
    }
  }
`

export const FilterTitle = styled.div`
  svg {
    margin-left: 8px;
  }

  margin-right: 1rem;
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: ${({ theme }) => theme.custom.colors.darkGray2};
`

export const FacetsTitleContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  min-height: 40px;
  align-items: end;
`

const PaginationContainer = styled.div`
  display: flex;
  justify-content: end;
  margin-top: 16px;
  margin-bottom: 16px;

  ul li button.Mui-selected {
    ${({ theme }) => css({ ...theme.typography.subtitle1 })}
    background-color: inherit;
  }

  ul li button svg {
    background-color: ${({ theme }) => theme.custom.colors.lightGray2};
    border-radius: 4px;
    width: 1.5em;
    height: 1.5em;
    padding: 0.25em;
  }
`

const StyledResultsContainer = styled.div`
  margin-top: 16px;

  ul > li + li {
    margin-top: 8px;
  }
`

const DesktopFiltersColumn = styled(GridColumn)`
  ${({ theme }) => theme.breakpoints.down("md")} {
    display: none;
  }

  padding-left: 0 !important;
  padding-right: 18px !important;
  padding-bottom: 25px;
`

const StyledMainColumn = styled(GridColumn)`
  ${({ theme }) => theme.breakpoints.up("md")} {
    padding-left: 6px !important;
    padding-right: 0 !important;
  }

  ${({ theme }) => theme.breakpoints.down("md")} {
    padding-left: 0 !important;
  }
`

const MobileFilter = styled.div`
  ${({ theme }) => theme.breakpoints.up("md")} {
    display: none;
  }

  color: ${({ theme }) => theme.custom.colors.darkGray2};
  margin-top: 20px;

  button {
    svg {
      margin-left: 8px;
    }

    margin-bottom: 10px;
  }
`

const StyledDrawer = styled(Drawer)`
  .MuiPaper-root {
    max-width: 332px;
    width: 85%;
    padding: 16px;
    background-color: ${({ theme }) => theme.custom.colors.lightGray1};
  }
`

const MobileClearAllButton = styled(Button)`
  background-color: white;
  padding: 12px;
  border-radius: 4px;
`

const MobileDrawerCloseButton = styled(Button)`
  svg {
    height: 1.5em;
    width: 1.5em;
  }

  padding-right: 0;
`

const MobileFacetsTitleContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  min-height: 45px;
  align-items: end;

  div div {
    float: left;
    margin-right: 10px;
    padding: 10px;
  }
`

const StyledGridContainer = styled(GridContainer)`
  max-width: 1272px !important;
  margin-left: 0 !important;
  width: 100% !important;
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
    label: "Best Match",
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

  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false)

  const toggleMobileDrawer = (newOpen: boolean) => () => {
    setMobileDrawerOpen(newOpen)
  }

  const filterContents = (
    <>
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
    </>
  )

  const sortDropdown = (
    <StyledDropdown
      initialValue={requestParams.sortby || ""}
      isMultiple={false}
      onChange={(e) => setParamValue("sortby", e.target.value)}
      options={SORT_OPTIONS}
      className="sort-dropdown"
      sx={{ fontSize: "small" }}
      renderValue={(value) => {
        const opt = SORT_OPTIONS.find((option) => option.key === value)
        return `Sort by: ${opt?.label}`
      }}
    />
  )

  return (
    <Container>
      <StyledGridContainer>
        <ResourceTypeTabs.Context
          resourceType={requestParams.resource_type?.[0]}
        >
          <DesktopFiltersColumn
            variant="sidebar-2"
            data-testid="facets-container"
          >
            <FacetsTitleContainer>
              <FilterTitle>
                <Typography variant="subtitle1">Filter</Typography>
                <RiEqualizerLine fontSize="medium" />
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
            {filterContents}
          </DesktopFiltersColumn>
          <StyledMainColumn variant="main-2">
            <DesktopSortContainer>{sortDropdown}</DesktopSortContainer>
            <StyledResourceTabs
              patchParams={patchParams}
              tabs={TABS}
              aggregations={data?.metadata.aggregations}
              onTabChange={() => setPage(1)}
            />
            <ResourceTypeTabs.TabPanels tabs={TABS}>
              <MobileFilter>
                <Button variant="text" onClick={toggleMobileDrawer(true)}>
                  <Typography variant="subtitle1">Filter</Typography>
                  <RiEqualizerLine fontSize="medium" />
                </Button>

                <StyledDrawer
                  anchor="left"
                  open={mobileDrawerOpen}
                  onClose={toggleMobileDrawer(false)}
                >
                  <MobileFacetsTitleContainer>
                    <div>
                      <div>
                        <Typography variant="subtitle3">Filter</Typography>
                      </div>
                      {hasFacets ? (
                        <MobileClearAllButton
                          variant="text"
                          size="small"
                          onClick={clearAllFacets}
                        >
                          Clear all
                        </MobileClearAllButton>
                      ) : null}
                    </div>
                    <MobileDrawerCloseButton
                      size="large"
                      variant="text"
                      aria-label="Close"
                      onClick={toggleMobileDrawer(false)}
                    >
                      <RiCloseLine fontSize="inherit" />
                    </MobileDrawerCloseButton>
                  </MobileFacetsTitleContainer>
                  {filterContents}
                </StyledDrawer>
                <MobileSortContainer>{sortDropdown}</MobileSortContainer>
              </MobileFilter>

              <StyledResultsContainer>
                {isLoading ? (
                  <PlainList itemSpacing={1.5}>
                    {Array(PAGE_SIZE)
                      .fill(null)
                      .map((a, index) => (
                        <li key={index}>
                          <ResourceListCard isLoading={isLoading} />
                        </li>
                      ))}
                  </PlainList>
                ) : data && data.count > 0 ? (
                  <PlainList itemSpacing={1.5}>
                    {data.results.map((resource) => (
                      <li key={resource.id}>
                        <ResourceListCard resource={resource} />
                      </li>
                    ))}
                  </PlainList>
                ) : (
                  <MuiCard>
                    <CardContent>No results found for your query.</CardContent>
                  </MuiCard>
                )}
              </StyledResultsContainer>
              <PaginationContainer>
                <Pagination
                  count={getLastPage(data?.count ?? 0)}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  renderItem={(item) => (
                    <PaginationItem
                      slots={{
                        previous: RiArrowLeftLine,
                        next: RiArrowRightLine,
                      }}
                      {...item}
                    />
                  )}
                />
              </PaginationContainer>
            </ResourceTypeTabs.TabPanels>
          </StyledMainColumn>
        </ResourceTypeTabs.Context>
      </StyledGridContainer>
    </Container>
  )
}

export default SearchDisplay
