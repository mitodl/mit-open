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
  getCertificationTypeName,
  getDepartmentName,
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

export const getFacetManifest = (
  offerors: Record<string, LearningResourceOfferor>,
) => {
  return [
    {
      type: "group",
      name: "free",
      facets: [
        {
          value: true,
          name: "free",
          label: "Free",
        },
      ],
    },
    {
      name: "certification_type",
      title: "Certificates",
      type: "static",
      expandedOnLoad: true,
      labelFunction: (key: string) => getCertificationTypeName(key) || key,
    },
    {
      name: "topic",
      title: "Topics",
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
  ]
}

const facetNames = [
  "resource_type",
  "certification_type",
  "learning_format",
  "department",
  "topic",
  "offered_by",
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
        facetManifest={facetManifest as FacetManifest}
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
