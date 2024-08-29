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
import { SearchInput } from "@/page-components/SearchDisplay/SearchInput"

import { getFacetManifest } from "@/pages/SearchPage/SearchPage"

import _ from "lodash"
import { styled, VisuallyHidden } from "ol-components"

const SearchInputContainer = styled.div`
  padding-bottom: 40px;
  margin-top: 80px;

  ${({ theme }) => theme.breakpoints.down("md")} {
    padding-bottom: 35px;
    margin-top: 40px;
  }
`

const StyledSearchInput = styled(SearchInput)`
  justify-content: center;
  ${({ theme }) => theme.breakpoints.up("md")} {
    .input-field {
      height: 40px;
      width: 450px;
    }

    .button-field {
      height: 40px;
      padding: 12px 16px 12px 12px;
      width: 20px;
    }
  }
`

const FACETS_BY_CHANNEL_TYPE: Record<ChannelTypeEnum, string[]> = {
  [ChannelTypeEnum.Topic]: [
    "free",
    "resource_type",
    "certification_type",
    "learning_format",
    "offered_by",
    "department",
  ],
  [ChannelTypeEnum.Department]: [
    "free",
    "resource_type",
    "certification_type",
    "topic",
    "learning_format",
    "offered_by",
  ],
  [ChannelTypeEnum.Unit]: [
    "free",
    "resource_type",
    "topic",
    "certification_type",
    "learning_format",
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
          onChange={(e) => setCurrentText(e.target.value)}
          onSubmit={(e) => {
            setCurrentTextAndQuery(e.target.value)
          }}
          onClear={() => {
            setCurrentTextAndQuery("")
          }}
          classNameInput="input-field"
          classNameSearch="button-field"
          placeholder="Search for courses, programs, and learning materials..."
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
