import _ from "lodash"
import React, { useCallback, useMemo } from "react"
import type { FacetManifest } from "@mitodl/course-search-utils"
import { useSearchParams } from "@mitodl/course-search-utils/react-router"
import {
  useResourceSearchParams,
  UseResourceSearchParamsProps,
  getCertificationTypeName,
  getDepartmentName,
} from "@mitodl/course-search-utils"
import SearchDisplay from "@/page-components/SearchDisplay/SearchDisplay"
import { SearchInput } from "@/page-components/SearchDisplay/SearchInput"
import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import type { LearningResourceOfferor } from "api"
import { useOfferorsList } from "api/hooks/learningResources"
import { styled, Container, Grid, theme } from "ol-components"
import { MetaTags, capitalize } from "ol-utilities"

const cssGradient = `
  linear-gradient(
    to bottom,
    ${theme.custom.colors.lightGray2} 0%,
    ${theme.custom.colors.lightGray1} 165px
  )
`

const Page = styled.div`
  background: ${cssGradient};

  ${({ theme }) => theme.breakpoints.up("md")} {
    background:
      url("/static/images/search_page_vector.png") no-repeat top left / 35%,
      ${cssGradient};
  }
`

const Header = styled.div`
  height: 165px;

  ${({ theme }) => theme.breakpoints.down("md")} {
    height: 75px;
  }

  display: flex;
  align-items: center;
`

const SearchField = styled(SearchInput)`
  ${({ theme }) => theme.breakpoints.up("md")} {
    width: 680px;
    min-width: 680px;
  }
`

const LEARNING_MATERIAL = "learning_material"

export const getFacetManifest = (
  offerors: Record<string, LearningResourceOfferor>,
  resourceCategory: string | null,
) => {
  const mainfest = [
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
      name: "resource_type",
      title: "Resource Type",
      type: "static",
      expandedOnLoad: true,
      preserveItems: true,
      labelFunction: (key: string) =>
        key
          .split("_")
          .map((word) => capitalize(word))
          .join(" "),
    },
    {
      name: "certification_type",
      title: "Certificate",
      type: "static",
      expandedOnLoad: true,
      preserveItems: true,
      labelFunction: (key: string) => getCertificationTypeName(key) || key,
    },
    {
      name: "topic",
      title: "Topic",
      type: "filterable",
      expandedOnLoad: true,
      preserveItems: true,
    },
    {
      name: "learning_format",
      title: "Format",
      type: "static",
      expandedOnLoad: true,
      preserveItems: true,
      labelFunction: (key: string) =>
        key
          .split("_")
          .map((word) => capitalize(word))
          .join("-"),
    },
    {
      name: "offered_by",
      title: "Offered By",
      type: "static",
      expandedOnLoad: false,
      preserveItems: true,
      labelFunction: (key: string) => offerors[key]?.name ?? key,
    },
    {
      name: "department",
      title: "Department",
      type: "filterable",
      expandedOnLoad: false,
      preserveItems: true,
      labelFunction: (key: string) => getDepartmentName(key) || key,
    },
  ]

  //Only display the resource_type facet if the resource_category is learning_material
  if (resourceCategory !== LEARNING_MATERIAL) {
    mainfest.splice(1, 1)
  }

  return mainfest
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

const useFacetManifest = (resourceCategory: string | null) => {
  const offerorsQuery = useOfferorsList()
  const offerors = useMemo(() => {
    return _.keyBy(offerorsQuery.data?.results ?? [], (o) => o.code)
  }, [offerorsQuery.data?.results])
  const facetManifest = useMemo(
    () => getFacetManifest(offerors, resourceCategory),
    [offerors, resourceCategory],
  )
  return facetManifest
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const facetManifest = useFacetManifest(searchParams.get("resource_category"))

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

  const onSearchTermSubmit = useCallback(
    (term: string) => {
      setCurrentTextAndQuery(term)
      setPage(1)
    },
    [setPage, setCurrentTextAndQuery],
  )

  const page = +(searchParams.get("page") ?? "1")

  return (
    <Page>
      <MetaTags title="Search" />
      <Header>
        <Container>
          <GridContainer>
            <GridColumn variant="sidebar-2"></GridColumn>
            <Grid item xs={12} md={6} container alignItems="center">
              <SearchField
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                onSubmit={(e) => {
                  onSearchTermSubmit(e.target.value)
                }}
                onClear={() => {
                  onSearchTermSubmit("")
                }}
                placeholder="What do you want to learn?"
              />
            </Grid>
          </GridContainer>
        </Container>
      </Header>
      <SearchDisplay
        page={page}
        setSearchParams={setSearchParams}
        requestParams={params}
        setPage={setPage}
        facetManifest={facetManifest as FacetManifest}
        facetNames={facetNames}
        constantSearchParams={constantSearchParams}
        hasFacets={hasFacets}
        setParamValue={setParamValue}
        clearAllFacets={clearAllFacets}
        toggleParamValue={toggleParamValue}
        showProfessionalToggle
      />
    </Page>
  )
}

export default SearchPage
