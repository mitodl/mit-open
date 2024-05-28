import React, { useCallback, useMemo } from "react"
import {
  styled,
  Pagination,
  Card,
  CardContent,
  PlainList,
  Skeleton,
  Container,
  Typography,
  Button,
} from "ol-components"

import TuneIcon from "@mui/icons-material/Tune"
import { capitalize } from "ol-utilities"

import {
  LearningResourcePlatform,
  LearningResourceOfferor,
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as LRSearchRequest,
} from "api"
import { ChannelTypeEnum } from "api/v0"
import {
  useLearningResourcesSearch,
  usePlatformsList,
  useOfferorsList,
} from "api/hooks/learningResources"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import {
  AvailableFacets,
  useResourceSearchParams,
  UseResourceSearchParamsProps,
  getDepartmentName,
  getLevelName,
} from "@mitodl/course-search-utils"
import type {
  Facets,
  BooleanFacets,
  FacetManifest,
} from "@mitodl/course-search-utils"
import { useSearchParams } from "@mitodl/course-search-utils/react-router"
import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"
import _ from "lodash"
import {
  getLastPage,
  TABS,
  SORT_OPTIONS,
  FacetsTitleContainer,
  FilterTitle,
  FacetStyles,
  SortContainer,
  StyledDropdown,
  StyledResourceTabs,
} from "../SearchPage/SearchPage"
import { ResourceTypeTabs } from "../SearchPage/ResourceTypeTabs"

const FACETS_BY_CHANNEL_TYPE: Record<ChannelTypeEnum, string[]> = {
  [ChannelTypeEnum.Topic]: [
    "free",
    "department",
    "offered_by",
    "learning_format",
  ],
  [ChannelTypeEnum.Department]: [
    "free",
    "topic",
    "offered_by",
    "learning_format",
  ],
  [ChannelTypeEnum.Offeror]: [
    "free",
    "topic",
    "platform",
    "department",
    "learning_format",
  ],
  [ChannelTypeEnum.Pathway]: [],
}

const getFacetManifest = (
  channelType: ChannelTypeEnum,
  offerors: Record<string, LearningResourceOfferor>,
  platforms: Record<string, LearningResourcePlatform>,
  constantSearchParams: Facets,
): FacetManifest => {
  return [
    {
      type: "group",
      facets: [
        {
          value: true,
          name: "free",
          label: "Free",
        },
      ],
      name: "free",
    },
    {
      name: "topic",
      title: "Topic",
      type: "filterable",
      expandedOnLoad: false,
    },
    {
      name: "department",
      title: "Department",
      type: "filterable",
      expandedOnLoad: false,
      labelFunction: (key: string) => getDepartmentName(key) || key,
    },
    {
      name: "level",
      title: "Level",
      type: "static",
      expandedOnLoad: false,
      labelFunction: (key: string) => getLevelName(key) || key,
    },
    {
      name: "platform",
      title: "Platform",
      type: "static",
      expandedOnLoad: false,
      labelFunction: (key: string) => platforms[key]?.name ?? key,
    },
    {
      name: "offered_by",
      title: "Offered By",
      type: "static",
      expandedOnLoad: false,
      labelFunction: (key: string) => offerors[key]?.name ?? key,
    },
    {
      name: "learning_format",
      title: "Format",
      type: "static",
      expandedOnLoad: false,
      labelFunction: (key: string) =>
        key
          .split("_")
          .map((word) => capitalize(word))
          .join("-"),
    },
  ].filter(
    (facetSetting) =>
      !Object.keys(constantSearchParams).includes(facetSetting.name) &&
      (FACETS_BY_CHANNEL_TYPE[channelType] || []).includes(facetSetting.name),
  ) as FacetManifest
}

const PaginationContainer = styled.div`
  display: flex;
  justify-content: end;
`

const StyledSkeleton = styled(Skeleton)`
  border-radius: 4px;
`

const PAGE_SIZE = 10

interface FeildSearchProps {
  constantSearchParams: Facets & BooleanFacets
  channelType: ChannelTypeEnum
}

const FieldSearch: React.FC<FeildSearchProps> = ({
  constantSearchParams,
  channelType,
}) => {
  const platformsQuery = usePlatformsList()
  const platforms = useMemo(() => {
    return _.keyBy(platformsQuery.data?.results ?? [], (p) => p.code)
  }, [platformsQuery.data?.results])

  const offerorsQuery = useOfferorsList()
  const offerors = useMemo(() => {
    return _.keyBy(offerorsQuery.data?.results ?? [], (o) => o.code)
  }, [offerorsQuery.data?.results])

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

  const facetManifest = useMemo(
    () =>
      getFacetManifest(channelType, offerors, platforms, constantSearchParams),
    [platforms, offerors, channelType, constantSearchParams],
  )

  const facetNames = Array.from(
    new Set(
      facetManifest.flatMap((facet) => {
        if (facet.type === "group") {
          return facet.facets.map((subfacet) => subfacet.name)
        } else {
          return [facet.name]
        }
      }),
    ),
  ).concat(["resource_type"]) as UseResourceSearchParamsProps["facets"]

  const {
    hasFacets,
    params,
    setParamValue,
    clearAllFacets,
    toggleParamValue,
    patchParams,
  } = useResourceSearchParams({
    searchParams,
    setSearchParams,
    facets: facetNames,
    onFacetsChange,
  })

  const allParams = useMemo(() => {
    return { ...constantSearchParams, ...params }
  }, [params, constantSearchParams])

  const page = +(searchParams.get("page") ?? "1")

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
                facetManifest={facetManifest}
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
  )
}

export default FieldSearch
