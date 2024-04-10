import React from "react"
import type {
  Aggregation,
  Bucket,
  Facets,
  FacetKey,
} from "@mitodl/course-search-utils"
import { FormControl, Select, MenuItem, SelectChangeEvent } from "ol-components"
export type KeyWithLabel = { key: string; label: string }

export type SingleFacetOptions = {
  name: string
  title: string
  labelFunction?: ((value: string) => string) | null
}

export type FacetManifest = SingleFacetOptions[]

interface FacetDisplayProps {
  facetMap: FacetManifest
  /**
   * Returns the aggregation options for a given group.
   *
   * If `activeFacets` includes a facet with no results, that facet will
   * automatically be included in the facet options.
   */
  facetOptions: (group: string) => Aggregation | null
  activeFacets: Facets
  clearAllFilters: () => void
  onFacetChange: (name: string, value: string, isEnabled: boolean) => void
  constantSearchParams: Facets
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
  facetOptions,
  activeFacets,
  onFacetChange,
  constantSearchParams,
}) => {
  const getHandleChangeForFacet = (active: string[], facetName: string) => {
    const handleChange = (event: SelectChangeEvent<string[]>) => {
      const {
        target: { value },
      } = event

      for (const selected of value) {
        if (!(active || []).includes(selected)) {
          onFacetChange(facetName, selected, true)
        }
      }

      for (const current of active || []) {
        if (!value.includes(current)) {
          onFacetChange(facetName, current, false)
        }
      }
    }

    return handleChange
  }

  return (
    <>
      {facetMap.map((facetSetting) => {
        const facetItems = filteredResultsWithLabels(
          facetOptions(facetSetting.name) || [],
          facetSetting.labelFunction || null,
          constantSearchParams[facetSetting.name as FacetKey] || null,
        )

        return (
          facetItems.length > 0 && (
            <FormControl key={facetSetting.name}>
              <Select
                multiple
                displayEmpty
                value={activeFacets[facetSetting.name as FacetKey] || []}
                renderValue={() => {
                  return facetSetting.title
                }}
                onChange={getHandleChangeForFacet(
                  activeFacets[facetSetting.name as FacetKey] || [],
                  facetSetting.name,
                )}
                sx={{ m: 1, minWidth: 140 }}
              >
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
