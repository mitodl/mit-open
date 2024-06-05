import React, { useCallback, useMemo } from "react"
import { LearningResourceOfferor } from "api"
import { ChannelTypeEnum } from "api/v0"
import { useOfferorsList } from "api/hooks/learningResources"

import {
  useResourceSearchParams,
  UseResourceSearchParamsProps,
} from "@mitodl/course-search-utils"
import type {
  Facets,
  BooleanFacets,
  FacetManifest,
} from "@mitodl/course-search-utils"
import { useSearchParams } from "@mitodl/course-search-utils/react-router"
import SearchDisplay from "@/page-components/SearchDisplay/SearchDisplay"
import { getFacetManifest } from "@/pages/SearchPage/SearchPage"

import _ from "lodash"

const FACETS_BY_CHANNEL_TYPE: Record<ChannelTypeEnum, string[]> = {
  [ChannelTypeEnum.Topic]: [
    "free",
    "certification_type",
    "department",
    "offered_by",
    "learning_format",
  ],
  [ChannelTypeEnum.Department]: [
    "free",
    "certification_type",
    "topic",
    "offered_by",
    "learning_format",
  ],
  [ChannelTypeEnum.Offeror]: [
    "free",
    "certification_type",
    "topic",
    "department",
    "learning_format",
  ],
  [ChannelTypeEnum.Pathway]: [],
}

const getFacetManifestForChannelType = (
  channelType: ChannelTypeEnum,
  offerors: Record<string, LearningResourceOfferor>,
  constantSearchParams: Facets,
): FacetManifest => {
  return getFacetManifest(offerors).filter(
    (facetSetting) =>
      !Object.keys(constantSearchParams).includes(facetSetting.name) &&
      (FACETS_BY_CHANNEL_TYPE[channelType] || []).includes(facetSetting.name),
  ) as FacetManifest
}

interface FeildSearchProps {
  constantSearchParams: Facets & BooleanFacets
  channelType: ChannelTypeEnum
}

const FieldSearch: React.FC<FeildSearchProps> = ({
  constantSearchParams,
  channelType,
}) => {
  const offerorsQuery = useOfferorsList()
  const offerors = useMemo(() => {
    return _.keyBy(offerorsQuery.data?.results ?? [], (o) => o.code)
  }, [offerorsQuery.data?.results])

  const [searchParams, setSearchParams] = useSearchParams()

  const facetManifest = useMemo(
    () =>
      getFacetManifestForChannelType(
        channelType,
        offerors,
        constantSearchParams,
      ),
    [offerors, channelType, constantSearchParams],
  )

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
  const page = +(searchParams.get("page") ?? "1")

  return (
    <SearchDisplay
      page={page}
      requestParams={params}
      setPage={setPage}
      facetManifest={facetManifest}
      facetNames={facetNames}
      constantSearchParams={constantSearchParams}
      hasFacets={hasFacets}
      setParamValue={setParamValue}
      clearAllFacets={clearAllFacets}
      toggleParamValue={toggleParamValue}
      patchParams={patchParams}
    />
  )
}

export default FieldSearch
