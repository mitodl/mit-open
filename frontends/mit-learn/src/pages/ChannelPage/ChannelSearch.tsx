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
import { Container, SearchInput, styled, VisuallyHidden } from "ol-components"

import { getFacetManifest } from "@/pages/SearchPage/SearchPage"

import _ from "lodash"

const SearchInputContainer = styled(Container)(({ theme }) => ({
  width: "100%",
  display: "flex",
  justifyContent: "center",
  paddingBottom: "40px",
  [theme.breakpoints.down("md")]: {
    paddingBottom: "35px",
  },
}))

const StyledSearchInput = styled(SearchInput)({
  width: "624px",
})

const FACETS_BY_CHANNEL_TYPE: Record<ChannelTypeEnum, string[]> = {
  [ChannelTypeEnum.Topic]: [
    "free",
    "resource_type",
    "certification_type",
    "delivery",
    "offered_by",
    "department",
  ],
  [ChannelTypeEnum.Department]: [
    "free",
    "resource_type",
    "certification_type",
    "topic",
    "delivery",
    "offered_by",
  ],
  [ChannelTypeEnum.Unit]: [
    "free",
    "resource_type",
    "topic",
    "certification_type",
    "delivery",
    "department",
  ],
  [ChannelTypeEnum.Pathway]: [],
}

const SHOW_PROFESSIONAL_TOGGLE_BY_CHANNEL_TYPE: Record<
  ChannelTypeEnum,
  boolean
> = {
  [ChannelTypeEnum.Topic]: true,
  [ChannelTypeEnum.Department]: false,
  [ChannelTypeEnum.Unit]: false,
  [ChannelTypeEnum.Pathway]: false,
}

const getFacetManifestForChannelType = (
  channelType: ChannelTypeEnum,
  offerors: Record<string, LearningResourceOfferor>,
  constantSearchParams: Facets,
  resourceCategory: string | null,
): FacetManifest => {
  const facets = FACETS_BY_CHANNEL_TYPE[channelType] || []
  return getFacetManifest(offerors, resourceCategory)
    .filter(
      (facetSetting) =>
        !Object.keys(constantSearchParams).includes(facetSetting.name) &&
        facets.includes(facetSetting.name),
    )
    .sort(
      (a, b) => facets.indexOf(a.name) - facets.indexOf(b.name),
    ) as FacetManifest
}

interface ChannelSearchProps {
  constantSearchParams: Facets & BooleanFacets
  channelType: ChannelTypeEnum
  channelTitle?: string
}

const ChannelSearch: React.FC<ChannelSearchProps> = ({
  constantSearchParams,
  channelType,
  channelTitle,
}) => {
  const offerorsQuery = useOfferorsList()
  const offerors = useMemo(() => {
    return _.keyBy(offerorsQuery.data?.results ?? [], (o) => o.code)
  }, [offerorsQuery.data?.results])

  const [searchParams, setSearchParams] = useSearchParams()
  const resourceCategory = searchParams.get("resource_category")

  const facetManifest = useMemo(
    () =>
      getFacetManifestForChannelType(
        channelType,
        offerors,
        constantSearchParams,
        resourceCategory,
      ),
    [offerors, channelType, constantSearchParams, resourceCategory],
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
  ) as UseResourceSearchParamsProps["facets"]

  const {
    hasFacets,
    params,
    setParamValue,
    clearAllFacets,
    toggleParamValue,
    currentText,
    setCurrentText,
    setCurrentTextAndQuery,
  } = useResourceSearchParams({
    searchParams,
    setSearchParams,
    facets: facetNames,
    onFacetsChange,
  })
  const page = +(searchParams.get("page") ?? "1")

  return (
    <section>
      <VisuallyHidden as="h2">Search within {channelTitle}</VisuallyHidden>
      <SearchInputContainer>
        <StyledSearchInput
          value={currentText}
          size="large"
          onChange={(e) => setCurrentText(e.target.value)}
          onSubmit={(e) => {
            setCurrentTextAndQuery(e.target.value)
          }}
          onClear={() => {
            setCurrentTextAndQuery("")
          }}
        />
      </SearchInputContainer>

      <SearchDisplay
        resultsHeadingEl="h3"
        filterHeadingEl="h3"
        page={page}
        setSearchParams={setSearchParams}
        requestParams={params}
        setPage={setPage}
        facetManifest={facetManifest}
        facetNames={facetNames}
        constantSearchParams={constantSearchParams}
        hasFacets={hasFacets}
        setParamValue={setParamValue}
        clearAllFacets={clearAllFacets}
        toggleParamValue={toggleParamValue}
        showProfessionalToggle={
          SHOW_PROFESSIONAL_TOGGLE_BY_CHANNEL_TYPE[channelType]
        }
      />
    </section>
  )
}

export default ChannelSearch
