import React, { useCallback, useMemo } from "react"
import {
  styled,
  SearchInput,
  Pagination,
  Card,
  CardContent,
} from "ol-components"
import { getReadableResourceType } from "ol-utilities"

import {
  ResourceTypeEnum,
  LearningResourcePlatform,
  LearningResourcesSearchApiLearningResourcesSearchRetrieveRequest as LRSearchRequest,
} from "api"
import {
  useLearningResourcesSearch,
  usePlatformsList,
} from "api/hooks/learningResources"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import {
  useResourceSearchParams,
  UseResourceSearchParamsProps,
} from "@mitodl/course-search-utils"
import type { Facets } from "@mitodl/course-search-utils"
import { useSearchParams } from "@mitodl/course-search-utils/react-router"
import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"
import CardRowList from "@/components/CardRowList/CardRowList"
import _ from "lodash"
import AvailableFacetsDropdowns from "./FieldSearchFacetDisplay"
import type { FacetManifest } from "./FieldSearchFacetDisplay"
import { getLastPage } from "../SearchPage/SearchPage"
const getFacetManifest = (
  platforms: Record<string, LearningResourcePlatform>,
  constantSearchParams: Facets,
): FacetManifest => {
  return [
    {
      name: "resource_type",
      title: "Learning Resource",
      labelFunction: (key: string) =>
        getReadableResourceType(key as ResourceTypeEnum) || key,
    },
    {
      name: "topic",
      title: "Topics",
    },
    {
      name: "platform",
      title: "Platforn",
      labelFunction: (key: string) => platforms[key]?.name ?? key,
    },
  ].filter((facetSetting) => !(facetSetting.name in constantSearchParams))
}
const FACET_NAMES = getFacetManifest({}, {}).map(
  (f) => f.name,
) as UseResourceSearchParamsProps["facets"]

const SearchField = styled(SearchInput)`
  background-color: ${({ theme }) => theme.custom.colorBackgroundLight};
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
  constantSearchParams: Facets
}

const FieldSearch: React.FC<FeildSearchProps> = ({ constantSearchParams }) => {
  const useFacetManifest = () => {
    const platformsQuery = usePlatformsList()

    const platforms = useMemo(() => {
      return _.keyBy(platformsQuery.data?.results ?? [], (p) => p.code)
    }, [platformsQuery.data?.results])
    const facetManifest = useMemo(
      () => getFacetManifest(platforms, constantSearchParams),
      [platforms],
    )
    return facetManifest
  }

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

  const allParams = useMemo(() => {
    return { ...constantSearchParams, ...params }
  }, [params, constantSearchParams])

  const facetManifest = useFacetManifest()

  const page = +(searchParams.get("page") ?? "1")

  const { data } = useLearningResourcesSearch(
    {
      ...(allParams as LRSearchRequest),
      aggregations: FACET_NAMES as LRSearchRequest["aggregations"],
      offset: (page - 1) * PAGE_SIZE,
    },
    { keepPreviousData: false },
  )

  return (
    <>
      <FieldSearchControls>
        <GridContainer>
          <GridColumn variant="main-2-wide-main">
            <AvailableFacetsDropdowns
              facetMap={facetManifest}
              activeFacets={allParams}
              onFacetChange={toggleParamValue}
              facetOptions={(name) => data?.metadata.aggregations?.[name] ?? []}
              constantSearchParams={constantSearchParams}
            />
          </GridColumn>
          <GridColumn variant="sidebar-2-wide-main">
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
              placeholder=""
            />
          </GridColumn>
        </GridContainer>
      </FieldSearchControls>
      <div>
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
      </div>
    </>
  )
}

export default FieldSearch
