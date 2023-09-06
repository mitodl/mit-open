import React, { useMemo } from "react"
import Container from "@mui/material/Container"
import EditIcon from "@mui/icons-material/Edit"
import Grid from "@mui/material/Grid"
import Button from "@mui/material/Button"
import SwapVertIcon from "@mui/icons-material/SwapVert"

import { useParams } from "react-router"

import {
  useLearningResourcesDetail,
  useInfiniteLearningPathItems
} from "api/hooks/learningResources"

import { BannerPage, useToggle, pluralize, MetaTags } from "ol-util"
import { GridColumn, GridContainer } from "../../components/layout"
import { manageListDialogs } from "./ManageListDialogs"

import ItemsListing from "./ItemsListing"

type RouteParams = {
  id: string
}

const LearningPathDetailsPage: React.FC = () => {
  const id = Number(useParams<RouteParams>().id)
  const pathQuery = useLearningResourcesDetail(id)
  const itemsQuery = useInfiniteLearningPathItems({ parent_id: id })
  const [isSorting, toggleIsSorting] = useToggle(false)

  const items = useMemo(() => {
    const pages = itemsQuery.data?.pages
    return pages?.flatMap(p => p.results ?? []) ?? []
  }, [itemsQuery.data])

  const canEdit = window.SETTINGS.user.is_learning_path_editor
  const showSort = canEdit && !!items.length
  const description = pathQuery.data?.description
  const count = pathQuery?.data?.learning_path?.item_count

  return (
    <BannerPage
      src="/static/images/course_search_banner.png"
      alt=""
      compactOnMobile
    >
      <MetaTags>
        <title>{pathQuery.data?.title}</title>
      </MetaTags>
      <Container maxWidth="sm" className="userlist-page">
        <GridContainer>
          <GridColumn variant="single-full">
            {pathQuery.data && (
              <Grid container className="ic-list-header">
                <Grid item xs={12}>
                  <h1>{pathQuery.data.title}</h1>
                  {description && <p>{description}</p>}
                </Grid>
                <Grid
                  item
                  xs={6}
                  container
                  alignItems="center"
                  justifyContent="space-between"
                >
                  {showSort && (
                    <Button
                      color="secondary"
                      disabled={count === 0}
                      startIcon={isSorting ? undefined : <SwapVertIcon />}
                      onClick={toggleIsSorting.toggle}
                    >
                      {isSorting ? "Done ordering" : "Reorder"}
                    </Button>
                  )}
                  {count !== undefined && count > 0 ?
                    `${count} ${pluralize("item", count)}` :
                    null}
                </Grid>
                <Grid
                  item
                  xs={6}
                  container
                  alignItems="center"
                  className="ic-centered-right"
                >
                  {canEdit ? (
                    <Button
                      color="secondary"
                      startIcon={<EditIcon />}
                      onClick={() => manageListDialogs.upsert(pathQuery.data)}
                    >
                      Edit
                    </Button>
                  ) : null}
                </Grid>
              </Grid>
            )}
            <ItemsListing
              items={items}
              isLoading={itemsQuery.isLoading}
              isRefetching={itemsQuery.isFetching}
              sortable={isSorting}
              emptyMessage="There are no items in this list yet."
            />
          </GridColumn>
        </GridContainer>
      </Container>
    </BannerPage>
  )
}

export default LearningPathDetailsPage
