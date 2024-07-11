import React from "react"
import { Grid, Button, Typography } from "ol-components"
import { RiPencilFill, RiArrowUpDownLine } from "@remixicon/react"
import { useUserMe } from "api/hooks/user"
import { useToggle, pluralize } from "ol-utilities"
import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import ItemsListing from "./ItemsListing"
import type { LearningResourceListItem } from "./ItemsListing"

type OnEdit = () => void
type ListData = {
  title: string
  description?: string | null
  item_count: number
}

type ItemsListingComponentProps = {
  listType: string
  list?: ListData
  items: LearningResourceListItem[]
  isLoading: boolean
  isFetching: boolean
  handleEdit: OnEdit
}

const ItemsListingComponent: React.FC<ItemsListingComponentProps> = (props) => {
  const { listType, list, items, isLoading, isFetching, handleEdit } = props
  const { data: user } = useUserMe()
  const [isSorting, toggleIsSorting] = useToggle(false)

  const canEdit = user?.is_learning_path_editor
  const showSort = canEdit && !!items.length
  const count = list?.item_count

  return (
    <GridContainer>
      <GridColumn variant="single-full">
        <Grid container>
          <Grid item xs={12}>
            <Typography variant="h3" component="h1">
              {list?.title}
            </Typography>
            {list?.description && <p>{list.description}</p>}
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
                startIcon={isSorting ? undefined : <RiArrowUpDownLine />}
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
                startIcon={<RiPencilFill />}
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

export default ItemsListingComponent
export type { ItemsListingComponentProps }
