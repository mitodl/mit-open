import React from "react"
import type {
  Aggregation,
  Bucket,
  Facets,
  FacetKey,
  BooleanFacets,
  BooleanFacetKey,
} from "@mitodl/course-search-utils"
import { BOOLEAN_FACET_NAMES } from "@mitodl/course-search-utils"
import { Skeleton, styled } from "ol-components"
import type { SimpleSelectOption } from "ol-components"
import { StyledSelect } from "@/page-components/SearchDisplay/SearchDisplay"

const StyledSkeleton = styled(Skeleton)`
  display: inline-flex;
  position: relative;
  transform: none;
  width: 138px;
  height: 40px;
  margin: 8px 10px;
  border-radius: 4px;
`

export type SingleFacetOptions = {
  name: string
  title: string
  labelFunction?: ((value: string) => string) | null
}

export type FacetManifest = SingleFacetOptions[]

interface FacetDisplayProps {
  facetManifest: FacetManifest
  isLoading?: boolean
  /**
   * Returns the aggregation options for a given group.
   *
   * If `activeFacets` includes a facet with no results, that facet will
   * automatically be included in the facet options.
   */
  facetOptions: (group: string) => Aggregation | null
  activeFacets: Facets & BooleanFacets
  clearAllFilters: () => void
  onFacetChange: (name: string, value: string | string[]) => void
  constantSearchParams: Facets & BooleanFacets
}

const filteredResultsWithLabels = (
  results: Aggregation,
  labelFunction: ((value: string) => string) | null | undefined,
  constantsForFacet: string[] | null,
): SimpleSelectOption[] => {
  const newResults = [] as SimpleSelectOption[]
  if (constantsForFacet) {
    constantsForFacet.map((key: string) => {
      newResults.push({
        value: key,
        label: labelFunction ? labelFunction(key) : key,
      })
    })
  } else {
    results.map((singleFacet: Bucket) => {
      newResults.push({
        value: singleFacet.key,
        label: labelFunction ? labelFunction(singleFacet.key) : singleFacet.key,
      })
    })
  }

  return newResults
}

const AvailableFacetsDropdowns: React.FC<
  Omit<FacetDisplayProps, "clearAllFilters">
> = ({
  facetManifest,
  isLoading,
  facetOptions,
  activeFacets,
  onFacetChange,
  constantSearchParams,
}) => {
  return (
    <>
      {facetManifest.map((facetSetting, index) => {
        const facetItems = filteredResultsWithLabels(
          facetOptions(facetSetting.name) || [],
          facetSetting.labelFunction || null,
          constantSearchParams[facetSetting.name as FacetKey] || null,
        )

        if (isLoading) {
          return <StyledSkeleton key={index} />
        }

        const isMultiple = BOOLEAN_FACET_NAMES.includes(facetSetting.name)
          ? false
          : true

        let displayValue
        if (BOOLEAN_FACET_NAMES.includes(facetSetting.name)) {
          displayValue =
            activeFacets[facetSetting.name as BooleanFacetKey] === true ||
            activeFacets[facetSetting.name as BooleanFacetKey] === false
              ? (
                  activeFacets[facetSetting.name as BooleanFacetKey] as boolean
                ).toString()
              : ""
        } else {
          displayValue = activeFacets[facetSetting.name as FacetKey] || []
        }

        if (!isMultiple) {
          facetItems.unshift({ value: "", label: "no selection" })
        }

        return (
          facetItems.length && (
            <StyledSelect
              key={facetSetting.name}
              value={displayValue}
              multiple={isMultiple}
              onChange={(e) => onFacetChange(facetSetting.name, e.target.value)}
              renderValue={() => {
                return facetSetting.title
              }}
              options={facetItems}
            />
          )
        )
      })}
    </>
  )
}

export default AvailableFacetsDropdowns
