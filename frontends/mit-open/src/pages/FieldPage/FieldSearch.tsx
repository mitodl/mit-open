import React, { useCallback, useMemo } from "react"
import {
  styled,
  SearchInput,
  Pagination,
  Card,
  CardContent,
  PlainList,
} from "ol-components"
import { getReadableResourceType } from "ol-utilities"

import {
  ResourceTypeEnum,
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
  useResourceSearchParams,
  UseResourceSearchParamsProps,
  getDepartmentName,
  getLevelName,
} from "@mitodl/course-search-utils"
import type { Facets, BooleanFacets } from "@mitodl/course-search-utils"
import { useSearchParams } from "@mitodl/course-search-utils/react-router"
import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"
import _ from "lodash"
import AvailableFacetsDropdowns from "./FieldSearchFacetDisplay"
import type {
  FacetManifest,
  SingleFacetOptions,
} from "./FieldSearchFacetDisplay"
import { getLastPage } from "../SearchPage/SearchPage"

const FACETS_BY_CHANNEL_TYPE: Record<ChannelTypeEnum, string[]> = {
  [ChannelTypeEnum.Topic]: [
    "resource_type",
    "offered_by",
    "department",
    "level",
    "certification",
  ],
  [ChannelTypeEnum.Department]: [
    "resource_type",
    "offered_by",
    "topic",
    "level",
    "certification",
  ],
  [ChannelTypeEnum.Offeror]: [
    "resource_type",
    "topic",
    "platform",
    "certification",
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
      name: "department",
      title: "Department",
      labelFunction: (key: string) => getDepartmentName(key) || key,
    },
    {
      name: "level",
      title: "Level",
      labelFunction: (key: string) => getLevelName(key) || key,
    },
    {
      name: "resource_type",
      title: "Resource Type",
      labelFunction: (key: string) =>
        getReadableResourceType(key as ResourceTypeEnum) || key,
    },
    {
      name: "topic",
      title: "Topic",
    },
    {
      name: "platform",
      title: "Platform",
      labelFunction: (key: string) => platforms[key]?.name ?? key,
    },
    {
      name: "offered_by",
      title: "Offered By",
      labelFunction: (key: string) => offerors[key]?.name ?? key,
    },
    {
      name: "certification",
      title: "Certification",
    },
  ].filter(
    (facetSetting: SingleFacetOptions) =>
      !Object.keys(constantSearchParams).includes(facetSetting.name) &&
      (FACETS_BY_CHANNEL_TYPE[channelType] || []).includes(facetSetting.name),
  )
}

const SearchField = styled(SearchInput)`
  background-color: ${({ theme }) => theme.custom.colors.white};
  width: 100%;
  margin-top: 9px;
`

const PaginationContainer = styled.div`
  display: flex;
  justify-content: end;
`

export const FieldSearchControls = styled.div`
  position: relative;
  flex-grow: 0.95;
  justify-content: flex-end;
  min-height: 38px;
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  margin-top: 30px;
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

  const facetNames = facetManifest.map(
    (f) => f.name,
  ) as UseResourceSearchParamsProps["facets"]

  const {
    params,
    setParamValue,
    currentText,
    setCurrentText,
    setCurrentTextAndQuery,
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

  const { data } = useLearningResourcesSearch(
    {
      ...(allParams as LRSearchRequest),
      aggregations: facetNames as LRSearchRequest["aggregations"],
      offset: (page - 1) * PAGE_SIZE,
    },
    { keepPreviousData: true },
  )

  return (
    <>
      <FieldSearchControls>
        <GridContainer>
          <GridColumn variant="main-2-wide-main">
            <AvailableFacetsDropdowns
              facetMap={facetManifest}
              activeFacets={allParams as Facets & BooleanFacets}
              onFacetChange={setParamValue}
              facetOptions={(name) => data?.metadata.aggregations?.[name] ?? []}
              constantSearchParams={constantSearchParams}
            />
          </GridColumn>
          <GridColumn variant="sidebar-2-wide-main">
            <SearchField
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              onSubmit={(e) => {
                setCurrentTextAndQuery(e.target.value)
              }}
              onClear={() => {
                setCurrentTextAndQuery("")
              }}
              placeholder=""
            />
          </GridColumn>
        </GridContainer>
      </FieldSearchControls>
      <div>
        {data && data.count > 0 ? (
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
      </div>
    </>
  )
}

export default FieldSearch
