import React from "react"
import { Container, Grid, Button, BannerPage, Typography } from "ol-components"
import EditIcon from "@mui/icons-material/Edit"
import SwapVertIcon from "@mui/icons-material/SwapVert"
import { useUserMe } from "api/hooks/user"
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

const ListDetailsComponent: React.FC<ListDetailsPageProps> = (props) => {
  const {
    listType,
    title,
    description,
    items,
    isLoading,
    isFetching,
    handleEdit,
  } = props
  const { data: user } = useUserMe()
  const [isSorting, toggleIsSorting] = useToggle(false)

  const canEdit = user?.is_learning_path_editor
  const showSort = canEdit && !!items.length
  const count = items.length

  return (
    <GridContainer>
      <GridColumn variant="single-full">
        <Grid container>
          <Grid item xs={12}>
            <Typography variant="h3" component="h1">
              {title}
            </Typography>
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
                variant="text"
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
              <Button
                variant="text"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
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
  )
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
  return (
    <BannerPage
      src="/static/images/course_search_banner.png"
      className="learningpaths-page"
    >
      <MetaTags>
        <title>{title}</title>
      </MetaTags>
      <Container maxWidth="sm">
        <ListDetailsComponent
          listType={listType}
          title={title}
          description={description}
          items={items}
          isLoading={isLoading}
          isFetching={isFetching}
          handleEdit={handleEdit}
        />
      </Container>
    </BannerPage>
  )
}

export { ListDetailsPage, ListDetailsComponent }
export type { ListDetailsPageProps }
