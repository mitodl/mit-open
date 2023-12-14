/*
 * Not imported anywhere - deprecate?
 */

import React, { useCallback, useState } from "react"
import { Button, IconButton } from "ol-components"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"

import FacetDisplay from "./FacetDisplay"
import { FacetManifest } from "ol-common"

import { Aggregation, Facets } from "@mitodl/course-search-utils"

interface Props {
  facetMap: FacetManifest
  facetOptions: (group: string) => Aggregation | null
  activeFacets: Facets
  onUpdateFacets: React.ChangeEventHandler<HTMLInputElement>
  clearAllFilters: () => void
  toggleFacet: (name: string, value: string, isEnabled: boolean) => void
  /**
   * Whether the drawer is always open. Useful in some wider-screen layouts.
   */
  alwaysOpen?: boolean
}

export default function SearchFilterDrawer(props: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const openDrawer = useCallback(() => setDrawerOpen(true), [setDrawerOpen])

  const closeDrawer = useCallback(() => setDrawerOpen(false), [setDrawerOpen])

  if (props.alwaysOpen) {
    return (
      <div className="mt-0 pt-3">
        <FacetDisplay {...props} />
      </div>
    )
  }

  return drawerOpen ? (
    <div className="search-filter-drawer-open">
      <div className="search-filter-header">
        <IconButton className="close-button" onClick={closeDrawer}>
          <i className="material-icons">close</i>
        </IconButton>
      </div>
      <div className="search-filter-contents">
        <Button onClick={closeDrawer} variant="contained">
          Apply Filters
        </Button>

        <FacetDisplay {...props} />
      </div>
    </div>
  ) : (
    <div className="search-filter-toggle">
      <Button
        onClick={openDrawer}
        color="secondary"
        endIcon={<ArrowDropDownIcon fontSize="inherit" />}
      >
        Filter
      </Button>
    </div>
  )
}
