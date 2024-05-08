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
import { FormControl, Select, MenuItem, Skeleton, styled } from "ol-components"
export type KeyWithLabel = { key: string; label: string }

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
  facetMap: FacetManifest
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
): KeyWithLabel[] => {
  const newResults = [] as KeyWithLabel[]
  if (constantsForFacet) {
    constantsForFacet.map((key: string) => {
      newResults.push({
        key: key,
        label: labelFunction ? labelFunction(key) : key,
      })
    })
  } else {
    results.map((singleFacet: Bucket) => {
      newResults.push({
        key: singleFacet.key,
        label: labelFunction ? labelFunction(singleFacet.key) : singleFacet.key,
      })
    })
  }

  return newResults
}

const AvailableFacetsDropdowns: React.FC<
  Omit<FacetDisplayProps, "clearAllFilters">
> = ({
  facetMap,
  isLoading,
  facetOptions,
  activeFacets,
  onFacetChange,
  constantSearchParams,
}) => {
  return (
    <>
      {facetMap.map((facetSetting, index) => {
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

        return (
          facetItems.length && (
            <FormControl key={facetSetting.name}>
              <Select
                multiple={isMultiple}
                displayEmpty
                value={displayValue}
                renderValue={() => {
                  return facetSetting.title
                }}
                onChange={(e) =>
                  onFacetChange(facetSetting.name, e.target.value)
                }
                sx={{ m: 1, minWidth: 140 }}
              >
                {!isMultiple ? (
                  <MenuItem
                    value=""
                    key={facetSetting.name.concat(":", "unselect")}
                  >
                    no selection
                  </MenuItem>
                ) : (
                  ""
                )}
                {filteredResultsWithLabels(
                  facetOptions(facetSetting.name) || [],
                  facetSetting.labelFunction || null,
                  constantSearchParams[facetSetting.name as FacetKey] || null,
                ).map((facet) => (
                  <MenuItem
                    value={facet.key}
                    key={facetSetting.name.concat(":", facet.key)}
                  >
                    {facet.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )
        )
      })}
    </>
  )
}

export default AvailableFacetsDropdowns
