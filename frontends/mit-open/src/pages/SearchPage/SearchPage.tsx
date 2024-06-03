import React, { useCallback, useMemo } from "react"
import { styled, Container, SearchInput, Grid } from "ol-components"
import { MetaTags, capitalize } from "ol-utilities"
import SearchDisplay from "@/page-components/SearchDisplay/SearchDisplay"

import type { LearningResourceOfferor } from "api"
import { useOfferorsList } from "api/hooks/learningResources"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import {
  useResourceSearchParams,
  UseResourceSearchParamsProps,
} from "@mitodl/course-search-utils"
import type { FacetManifest } from "@mitodl/course-search-utils"
import { useSearchParams } from "@mitodl/course-search-utils/react-router"

import _ from "lodash"

const ColoredHeader = styled.div`
  background-color: #394357;
  height: 150px;
  display: flex;
  align-items: center;
`

const SearchField = styled(SearchInput)`
  background-color: ${({ theme }) => theme.custom.colors.white};
  width: 100%;
`

const getFacetManifest = (
  offerors: Record<string, LearningResourceOfferor>,
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
        {
          value: true,
          name: "certification",
          label: "With Certificate",
        },
        {
          value: true,
          name: "professional",
          label: "Professional",
        },
      ],
    },
    {
      name: "topic",
      title: "Topics",
      type: "filterable",
      expandedOnLoad: true,
    },
    {
      name: "offered_by",
      title: "Offered By",
      type: "static",
      expandedOnLoad: true,
      labelFunction: (key) => offerors[key]?.name ?? key,
    },
    {
      name: "learning_format",
      title: "Format",
      type: "static",
      expandedOnLoad: true,
      labelFunction: (key) =>
        key
          .split("_")
          .map((word) => capitalize(word))
          .join("-"),
    },
  ]
}

const facetNames = [
  "resource_type",
  "learning_format",
  "topic",
  "offered_by",
  "certification",
  "free",
  "professional",
] as UseResourceSearchParamsProps["facets"]

const constantSearchParams = {}

const useFacetManifest = () => {
  const offerorsQuery = useOfferorsList()
  const offerors = useMemo(() => {
    return _.keyBy(offerorsQuery.data?.results ?? [], (o) => o.code)
  }, [offerorsQuery.data?.results])
  const facetManifest = useMemo(() => getFacetManifest(offerors), [offerors])
  return facetManifest
}

const SearchPage: React.FC = () => {
  const facetManifest = useFacetManifest()

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
    hasFacets,
    clearAllFacets,
    patchParams,
    toggleParamValue,
    currentText,
    setCurrentText,
    setCurrentTextAndQuery,
    setParamValue,
  } = useResourceSearchParams({
    searchParams,
    setSearchParams,
    facets: facetNames,
    onFacetsChange,
  })

  const page = +(searchParams.get("page") ?? "1")

  return (
    <>
      <MetaTags>
        <title>Search</title>
      </MetaTags>
      <ColoredHeader>
        <Container>
          <GridContainer>
            <GridColumn variant="sidebar-2-wide-main"></GridColumn>
            <Grid item xs={12} md={6} container alignItems="center">
              <SearchField
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                onSubmit={(e) => {
                  setCurrentTextAndQuery(e.target.value)
                }}
                onClear={() => {
                  setCurrentTextAndQuery("")
                }}
                placeholder="Search for resources"
              />
            </Grid>
          </GridContainer>
        </Container>
      </ColoredHeader>
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
    </>
  )
}

export default SearchPage
