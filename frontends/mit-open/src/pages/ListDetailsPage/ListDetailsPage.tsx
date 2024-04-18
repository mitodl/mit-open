import React from "react"
import { Container, Grid, Button, BannerPage } from "ol-components"
import EditIcon from "@mui/icons-material/Edit"
import SwapVertIcon from "@mui/icons-material/SwapVert"

import { useToggle, pluralize, MetaTags } from "ol-utilities"
import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"

import ItemsListing from "./ItemsListing"
import type { LearningResourceListItem } from "./ItemsListing"

type OnEdit = () => void
type ListDetailsPageProps = {
  listType: string
  title: string | undefined
  description: string | null | undefined
  items: LearningResourceListItem[]
  isLoading: boolean
  isFetching: boolean
  handleEdit: OnEdit
}

const ListDetailsPage: React.FC<ListDetailsPageProps> = ({
  listType,
  title,
  description,
  items,
  isLoading,
  isFetching,
  handleEdit,
}) => {
  const [isSorting, toggleIsSorting] = useToggle(false)

  const canEdit = window.SETTINGS.user.is_learning_path_editor
  const showSort = canEdit && !!items.length
  const count = items.length

  return (
    <BannerPage
      src="/static/images/course_search_banner.png"
      alt=""
      className="learningpaths-page"
    >
      <MetaTags>
        <title>{title}</title>
      </MetaTags>
      <Container maxWidth="sm">
        <GridContainer>
          <GridColumn variant="single-full">
            <Grid container>
              <Grid item xs={12}>
                <h1>{title}</h1>
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
                    disabled={count === 0}
                    startIcon={isSorting ? undefined : <SwapVertIcon />}
                    onClick={toggleIsSorting.toggle}
                  >
                    {isSorting ? "Done ordering" : "Reorder"}
                  </Button>
                )}
                {count !== undefined && count > 0
                  ? `${count} ${pluralize("item", count)}`
                  : null}
              </Grid>
              <Grid
                item
                xs={6}
                container
                justifyContent="flex-end"
                alignItems="center"
                display="flex"
              >
                {canEdit ? (
                  <Button startIcon={<EditIcon />} onClick={handleEdit}>
                    Edit
                  </Button>
                ) : null}
              </Grid>
            </Grid>
            <ItemsListing
              listType={listType}
              items={items}
              isLoading={isLoading}
              isRefetching={isFetching}
              sortable={isSorting}
              emptyMessage="There are no items in this list yet."
            />
          </GridColumn>
        </GridContainer>
      </Container>
    </BannerPage>
  )
}

export default ListDetailsPage
export type { ListDetailsPageProps }
