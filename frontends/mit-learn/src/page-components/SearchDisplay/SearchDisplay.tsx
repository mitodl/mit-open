import React, { useMemo, useRef, useState } from "react"
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
  Checkbox,
  VisuallyHidden,
} from "ol-components"

import {
  RiCloseLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiEqualizerLine,
} from "@remixicon/react"

import {
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as LRSearchRequest,
  ResourceCategoryEnum,
  SearchModeEnumDescriptions,
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
import { ResourceCategoryTabs } from "./ResourceCategoryTabs"
import ProfessionalToggle from "./ProfessionalToggle"
import SliderInput from "./SliderInput"

import type { TabConfig } from "./ResourceCategoryTabs"

import { ResourceListCard } from "../ResourceCard/ResourceCard"
import { useSearchParams } from "@mitodl/course-search-utils/react-router"
import { useUserMe } from "api/hooks/user"

export const StyledSelect = styled(SimpleSelect)`
  min-width: 160px;
`

const StyledResourceTabs = styled(ResourceCategoryTabs.TabList)`
  margin-top: 0 px;
`

const DesktopSortContainer = styled.div`
  float: right;

  ${({ theme }) => theme.breakpoints.down("md")} {
    display: none;
  }
`
const MobileSortContainer = styled.div`
  float: right;
  ${({ theme }) => theme.breakpoints.up("md")} {
    display: none;
  }
`

const SearchModeDropdownContainer = styled.div`
  margin-top: 10px;
  margin-bottom: 10px;
`

const FacetStyles = styled.div`
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
    padding: 0;
    background-color: transparent;
    display: flex;
    width: 100%;
    border: none;
    cursor: pointer;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;

    i {
      color: ${({ theme }) => theme.custom.colors.silverGrayLight};
    }

    &:hover i {
      color: ${({ theme }) => theme.custom.colors.darkGray2};
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
    margin-top: 6px;
    margin-bottom: 6px;
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
    max-height: 55px;
    transition: max-height 0.4s ease-out;
    overflow: hidden;

    &.facets-expanded {
      max-height: 600px;
      transition: max-height 0.4s ease-in;
    }

    .facet-visible {
      display: flex;
      flex-direction: row;
      align-items: center;
      height: 25px;
      font-size: 0.875em;
      gap: 4px;
      margin-left: -2px;

      input,
      label {
        cursor: pointer;
      }

      ${Checkbox.styles}

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
    margin-top: 0;
    margin-bottom: 10px;
    width: 100%;
  }

  .multi-facet-group {
    background: white;
    margin-top: 8px;
    margin-bottom: 8px;
    border-radius: 8px;
    border-bottom: solid 1px ${({ theme }) => theme.custom.colors.lightGray2};
    padding-bottom: 12px;
    padding-top: 5px;

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

const FilterTitle = styled.div`
  svg {
    margin-left: 8px;
  }

  margin-right: 1rem;
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: ${({ theme }) => theme.custom.colors.darkGray2};
`

const FacetsTitleContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  min-height: 40px;
  align-items: end;
`

const PaginationContainer = styled.div`
  display: flex;
  justify-content: end;
  margin-top: 24px;
  margin-bottom: 80px;

  ${({ theme }) => theme.breakpoints.down("md")} {
    margin-top: 16px;
    margin-bottom: 24px;
  }

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
  display: flex;
  gap: 12px;

  & > button {
    flex: 1;
  }
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

const ExplanationContainer = styled.div`
  ${({ theme }) => css({ ...theme.typography.body3 })}
  color: ${({ theme }) => theme.custom.colors.silverGrayDark};
`
const AdminTitleContainer = styled.div`
  ${({ theme }) => css({ ...theme.typography.subtitle3 })}
  margin-top: 20px;
`

const PAGE_SIZE = 20
const MAX_PAGE = 50

const getLastPage = (count: number): number => {
  const pages = Math.ceil(count / PAGE_SIZE)
  return pages > MAX_PAGE ? MAX_PAGE : pages
}

const TABS: TabConfig[] = [
  {
    name: "all",
    label: "All",
    defaultTab: true,
    resource_category: null,
    minWidth: 85,
  },
  {
    name: "courses",
    label: "Courses",
    resource_category: ResourceCategoryEnum.Course,
    minWidth: 112,
  },
  {
    name: "programs",
    label: "Programs",
    resource_category: ResourceCategoryEnum.Program,
    minWidth: 118,
  },
  {
    name: "learning-materials",
    label: "Learning Materials",
    resource_category: ResourceCategoryEnum.LearningMaterial,
    minWidth: 172,
  },
]

const SORT_OPTIONS = [
  {
    label: "Best Match",
    value: "",
  },
  {
    label: "New",
    value: "new",
  },
  {
    label: "Popular",
    value: "-views",
  },
  {
    label: "Upcoming",
    value: "upcoming",
  },
]

const searchModeDropdownOptions = Object.entries(
  SearchModeEnumDescriptions,
).map(([label, value]) => ({ label, value }))

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
  resultsHeadingEl: React.ElementType
  filterHeadingEl: React.ElementType
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
  resultsHeadingEl,
  filterHeadingEl,
}) => {
  const [searchParams] = useSearchParams()
  const [expandAdminOptions, setExpandAdminOptions] = useState(false)
  const scrollHook = useRef<HTMLDivElement>(null)
  const activeTab =
    TABS.find(
      (t) => t.resource_category === searchParams.get("resource_category"),
    ) ??
    TABS.find((t) => t.defaultTab) ??
    TABS[0]
  const allParams = useMemo(() => {
    return {
      ...constantSearchParams,
      resource_category: activeTab.resource_category
        ? [activeTab.resource_category]
        : undefined,
      yearly_decay_percent: searchParams.get("yearly_decay_percent"),
      search_mode: searchParams.get("search_mode"),
      slop: searchParams.get("slop"),
      min_score: searchParams.get("min_score"),
      max_incompleteness_penalty: searchParams.get(
        "max_incompleteness_penalty",
      ),
      use_dfs_query_then_fetch: searchParams.get("use_dfs_query_then_fetch"),
      ...requestParams,
      aggregations: (facetNames || []).concat([
        "resource_category",
      ]) as LRSearchRequest["aggregations"],
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    }
  }, [
    searchParams,
    requestParams,
    constantSearchParams,
    activeTab?.resource_category,
    facetNames,
    page,
  ])

  const { data, isLoading } = useLearningResourcesSearch(
    allParams as LRSearchRequest,
    { keepPreviousData: true },
  )

  const { data: user } = useUserMe()

  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false)

  const toggleMobileDrawer = (newOpen: boolean) => () => {
    setMobileDrawerOpen(newOpen)
  }

  const searchModeDropdown = (
    <StyledSelect
      size="small"
      value={searchParams.get("search_mode") || "best_fields"}
      onChange={(e) =>
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.set("search_mode", e.target.value as string)
          if (e.target.value !== "phrase") {
            next.delete("slop")
          }
          return next
        })
      }
      options={searchModeDropdownOptions}
      className="search-mode-dropdown"
    />
  )

  const sortDropdown = (
    <StyledSelect
      size="small"
      value={requestParams.sortby || ""}
      onChange={(e) => setParamValue("sortby", e.target.value)}
      options={SORT_OPTIONS}
      className="sort-dropdown"
      renderValue={(value) => {
        const opt = SORT_OPTIONS.find((option) => option.value === value)
        return `Sort by: ${opt?.label}`
      }}
    />
  )

  const AdminOptions: React.FC = (
    expandAdminOptions,
    setExpandAdminOptions,
  ) => {
    const titleLineIcon = expandAdminOptions ? "expand_less" : "expand_more"

    return (
      <div
        className={`facets base-facet${expandAdminOptions ? " facets-expanded" : ""}`}
      >
        <button
          className="filter-section-button"
          type="button"
          aria-expanded={expandAdminOptions ? "true" : "false"}
          onClick={() => setExpandAdminOptions(!expandAdminOptions)}
        >
          Admin Options
          <i className={`material-icons ${titleLineIcon}`} aria-hidden="true">
            {titleLineIcon}
          </i>
        </button>
        {expandAdminOptions ? (
          <div>
            <AdminTitleContainer>
              Resource Score Staleness Penalty
            </AdminTitleContainer>
            <SliderInput
              currentValue={
                searchParams.get("yearly_decay_percent")
                  ? Number(searchParams.get("yearly_decay_percent"))
                  : 2.5
              }
              setSearchParams={setSearchParams}
              urlParam="yearly_decay_percent"
              min={0}
              max={10}
              step={0.2}
            />
            <ExplanationContainer>
              Relavance score penalty percent per year for resources without
              upcoming runs. Only affects results if there is a search term.
            </ExplanationContainer>
            <div>
              <AdminTitleContainer>Search Mode</AdminTitleContainer>
              <SearchModeDropdownContainer>
                {searchModeDropdown}
              </SearchModeDropdownContainer>
              <ExplanationContainer>
                OpenSearch search multi-match query type.
              </ExplanationContainer>
            </div>
            {searchParams.get("search_mode") === "phrase" ? (
              <div>
                <AdminTitleContainer>Slop</AdminTitleContainer>

                <SliderInput
                  currentValue={
                    searchParams.get("slop")
                      ? Number(searchParams.get("slop"))
                      : 0
                  }
                  setSearchParams={setSearchParams}
                  urlParam="slop"
                  min={0}
                  max={20}
                  step={1}
                />
                <ExplanationContainer>
                  The number of words permitted between search terms for
                  multi-word searches. Only used if search mode is set to
                  "phrase".
                </ExplanationContainer>
              </div>
            ) : null}
            <AdminTitleContainer>Minimum Score Cutoff</AdminTitleContainer>
            <SliderInput
              currentValue={
                searchParams.get("min_score")
                  ? Number(searchParams.get("min_score"))
                  : 0
              }
              setSearchParams={setSearchParams}
              urlParam="min_score"
              min={0}
              max={20}
              step={0.5}
            />
            <ExplanationContainer>
              Minimum relevance score for a search result to be displayed. Only
              affects results if there is a search term.
            </ExplanationContainer>
            <AdminTitleContainer>
              Maximum Incompleteness Penalty
            </AdminTitleContainer>
            <SliderInput
              currentValue={
                searchParams.get("max_incompleteness_penalty")
                  ? Number(searchParams.get("max_incompleteness_penalty"))
                  : 0
              }
              setSearchParams={setSearchParams}
              urlParam="max_incompleteness_penalty"
              min={0}
              max={100}
              step={1}
            />
            <ExplanationContainer>
              Maximum score penalty for incomplete OCW courses in percent. An
              OCW course with completeness = 0 will have this score penalty.
              Partially complete courses have a linear penalty proportional to
              the degree of incompleteness. Only affects results if there is a
              search term.
            </ExplanationContainer>
          </div>
        ) : null}
      </div>
    )
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
        {user?.is_learning_path_editor
          ? AdminOptions(expandAdminOptions, setExpandAdminOptions)
          : null}
      </FacetStyles>
    </>
  )

  return (
    <Container>
      <StyledGridContainer>
        <ResourceCategoryTabs.Context activeTabName={activeTab.name}>
          <DesktopFiltersColumn
            component="section"
            variant="sidebar-2"
            data-testid="facets-container"
          >
            <FacetsTitleContainer>
              <FilterTitle>
                <Typography component={filterHeadingEl} variant="subtitle1">
                  Filter
                </Typography>
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
          <StyledMainColumn component="section" variant="main-2">
            <VisuallyHidden as={resultsHeadingEl}>
              Search Results
            </VisuallyHidden>
            <DesktopSortContainer>{sortDropdown}</DesktopSortContainer>
            <StyledResourceTabs
              setSearchParams={setSearchParams}
              tabs={TABS}
              aggregations={data?.metadata.aggregations}
              onTabChange={() => setPage(1)}
            />
            <ResourceCategoryTabs.TabPanels tabs={TABS}>
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
                        <Typography component="h2" variant="subtitle3">
                          Filter
                        </Typography>
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
                      <Button
                        variant="primary"
                        size="small"
                        onClick={toggleMobileDrawer(false)}
                      >
                        Apply Filters
                      </Button>
                      <Button
                        variant="noBorder"
                        size="small"
                        onClick={clearAllFacets}
                      >
                        Clear All
                      </Button>
                    </MobileFacetSearchButtons>
                  ) : null}
                  {filterContents}
                </StyledDrawer>
                <MobileSortContainer>{sortDropdown}</MobileSortContainer>
              </MobileFilter>
              <StyledResultsContainer>
                <div ref={scrollHook} />
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
                  onChange={(_, newPage) => {
                    setPage(newPage)
                    setTimeout(() => {
                      scrollHook.current?.scrollIntoView({
                        block: "center",
                        behavior: "smooth",
                      })
                    }, 0)
                  }}
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
            </ResourceCategoryTabs.TabPanels>
          </StyledMainColumn>
        </ResourceCategoryTabs.Context>
      </StyledGridContainer>
    </Container>
  )
}

export default SearchDisplay
