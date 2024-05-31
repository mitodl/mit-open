import React, { useCallback, useMemo } from "react"

import { capitalize } from "ol-utilities"

import { LearningResourcePlatform, LearningResourceOfferor } from "api"
import { ChannelTypeEnum } from "api/v0"
import { usePlatformsList, useOfferorsList } from "api/hooks/learningResources"

import {
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
import SearchDisplay from "@/page-components/SearchDisplay/SearchDisplay"

import _ from "lodash"

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

  const facetManifest = useMemo(
    () =>
      getFacetManifest(channelType, offerors, platforms, constantSearchParams),
    [platforms, offerors, channelType, constantSearchParams],
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
