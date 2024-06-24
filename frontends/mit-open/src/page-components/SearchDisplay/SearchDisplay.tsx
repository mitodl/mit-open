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
import { useSearchParams } from "@mitodl/course-search-utils/react-router"

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
    align-items: baseline;

    label {
      ${truncateText(1)};
      color: ${({ theme }) => theme.custom.colors.silverGrayDark};
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
      gap: 4px;

      input,
      label {
        cursor: pointer;
      }

      input[type="checkbox"] {
        margin-left: 0;
        margin-right: 2px;
        height: 24px;
        width: 24px;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 0H17C17.5523 0 18 0.44772 18 1V17C18 17.5523 17.5523 18 17 18H1C0.44772 18 0 17.5523 0 17V1C0 0.44772 0.44772 0 1 0ZM2 2V16H16V2H2Z' fill='%23B8C2CC'/%3E%3C/svg%3E%0A");
        background-repeat: no-repeat;
        background-position: 3px 3px;
      }

      input[type="checkbox"]:hover {
        background-image: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 0H17C17.5523 0 18 0.44772 18 1V17C18 17.5523 17.5523 18 17 18H1C0.44772 18 0 17.5523 0 17V1C0 0.44772 0.44772 0 1 0ZM2 2V16H16V2H2Z' fill='%23626A73'/%3E%3C/svg%3E%0A");
      }

      input[type="checkbox"]:checked {
        background-image: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 0H17C17.5523 0 18 0.44772 18 1V17C18 17.5523 17.5523 18 17 18H1C0.44772 18 0 17.5523 0 17V1C0 0.44772 0.44772 0 1 0ZM8.0026 13L15.0737 5.92893L13.6595 4.51472L8.0026 10.1716L5.17421 7.3431L3.75999 8.7574L8.0026 13Z' fill='%23A31F34'/%3E%3C/svg%3E%0A");
      }

      .facet-count {
        font-size: 12px;
        padding-left: 3px;
        color: ${({ theme }) => theme.custom.colors.silverGrayDark};
        float: right;
      }
    }

    .facet-visible.checked .facet-label label,
    .facet-visible .facet-label label:hover,
    .facet-visible input:hover + .facet-label label {
      color: ${({ theme }) => theme.custom.colors.darkGray2};
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

    /* stylelint-disable no-descending-specificity */
    .facet-visible {
      .facet-label {
        label,
        .facet-count {
          color: ${({ theme }) => theme.custom.colors.darkGray2};
        }
      }

      margin-bottom: 0;
    }
    /* stylelint-enable no-descending-specificity */
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

const MobileFacetSearchButtons = styled.div`
  width: 100%;
  gap: 12px;
`

const MobileApplyFiltersButton = styled(Button)`
  background-color: ${({ theme }) => theme.custom.colors.mitRed};
  color: ${({ theme }) => theme.custom.colors.white};
  padding: 12px;
  border-radius: 4px;
  width: 144px;
  margin-right: 12px;
  box-shadow:
    0 2px 4px 0 #25262b1a,
    0 3px 8px 0 #25262b1f;
`

const MobileClearAllButton = styled(Button)`
  background-color: white;
  padding: 12px;
  border-radius: 4px;
  width: 144px;
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
    name: "all",
    label: "All",
    defaultTab: true,
    resource_type: [],
  },
  {
    name: "courses",
    label: "Courses",
    resource_type: [ResourceTypeEnum.Course],
  },
  {
    name: "programs",
    label: "Programs",
    resource_type: [ResourceTypeEnum.Program],
  },
  {
    name: "learning-materials",
    label: "Learning Materials",
    resource_type: Object.values(ResourceTypeEnum).filter(
      (v) => v !== ResourceTypeEnum.Course && v !== ResourceTypeEnum.Program,
    ),
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
  showProfessionalToggle?: boolean
  /**
   * NOTE: This is passed from parent, rather than obtained via useSearchParams,
   * because of quirks with react-router's useSearchParams hook.
   *
   * Multiple calls to React Router's useSearchParam hook do not use current
   * values for the search params.
   * See https://github.com/remix-run/react-router/issues/9757 for details.
   *
   * This is partially addressed by `@mitodl/course-search-utils`, which exports
   * a wrapper around `useSearchParams`: subsequent calls to `setSearchParams`
   * DO use the current value, with one caveat: The setSearchParams function
   * must be from the same "instance" of `useSearchParams`.
   *
   * Because of this, we pass the setSearchParams function from the parent
   * rather than from a new "instance" of `useSearchParams`.
   */
  setSearchParams: UseResourceSearchParamsProps["setSearchParams"]
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
  showProfessionalToggle,
  setSearchParams,
}) => {
  const [searchParams] = useSearchParams()
  const activeTab =
    TABS.find((t) => t.name === searchParams.get("tab")) ??
    TABS.find((t) => t.defaultTab) ??
    TABS[0]
  const allParams = useMemo(() => {
    return {
      ...constantSearchParams,
      resource_type: activeTab.resource_type,
      ...requestParams,
      aggregations: facetNames as LRSearchRequest["aggregations"],
      offset: (page - 1) * PAGE_SIZE,
    }
  }, [
    requestParams,
    constantSearchParams,
    activeTab?.resource_type,
    facetNames,
    page,
  ])

  const { data, isLoading } = useLearningResourcesSearch(
    allParams as LRSearchRequest,
    { keepPreviousData: true },
  )

  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false)

  const toggleMobileDrawer = (newOpen: boolean) => () => {
    setMobileDrawerOpen(newOpen)
  }

  const filterContents = (
    <>
      <FacetStyles>
        {showProfessionalToggle && (
          <ProfessionalToggle
            professionalSetting={requestParams.professional}
            setParamValue={setParamValue}
          />
        )}
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
        <ResourceTypeTabs.Context activeTabName={activeTab.name}>
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
              setSearchParams={setSearchParams}
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
                  {hasFacets ? (
                    <MobileFacetSearchButtons>
                      <MobileApplyFiltersButton
                        variant="text"
                        size="small"
                        onClick={toggleMobileDrawer(false)}
                      >
                        Apply Filters
                      </MobileApplyFiltersButton>
                      <MobileClearAllButton
                        variant="text"
                        size="small"
                        onClick={clearAllFacets}
                      >
                        Clear All
                      </MobileClearAllButton>
                    </MobileFacetSearchButtons>
                  ) : null}
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
