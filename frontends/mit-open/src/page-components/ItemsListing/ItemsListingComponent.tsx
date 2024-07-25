import React from "react"
import { Grid, Button, Typography, styled } from "ol-components"
import { RiPencilFill, RiArrowUpDownLine } from "@remixicon/react"
import { useToggle, pluralize } from "ol-utilities"
import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import ItemsListing from "./ItemsListing"
import type { LearningResourceListItem } from "./ItemsListing"

const Container = styled(GridContainer)`
  margin-top: 30px;
  margin-bottom: 100px;
`

const TitleContainer = styled(Grid)`
  margin-top: 10px;
  margin-bottom: 20px;
`

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
  showSort: boolean
  canEdit: boolean
  isLoading: boolean
  isFetching: boolean
  handleEdit: OnEdit
  condensed?: boolean
}

const ItemsListingComponent: React.FC<ItemsListingComponentProps> = ({
  listType,
  list,
  items,
  showSort,
  canEdit,
  isLoading,
  isFetching,
  handleEdit,
  condensed = false,
}) => {
  const [isSorting, toggleIsSorting] = useToggle(false)

  const count = list?.item_count

  return (
    <Container>
      <GridColumn variant="single-full">
        <Grid container>
          <TitleContainer item xs={12}>
            <Typography variant="h3" component="h1">
              {list?.title}
            </Typography>
            {list?.description && <p>{list.description}</p>}
          </TitleContainer>
          <Grid
            item
            xs={6}
            container
            alignItems="center"
            justifyContent="space-between"
          >
            {showSort && !!items.length && (
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
          condensed={condensed}
        />
      </GridColumn>
    </Container>
  )
}

export default ItemsListingComponent
export type { ItemsListingComponentProps }
