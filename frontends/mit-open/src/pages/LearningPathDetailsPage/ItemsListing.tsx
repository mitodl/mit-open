import React, { useCallback, useEffect } from "react"
import type { LearningPathRelationship } from "api"
import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"
import {
  SortableItem,
  SortableList,
  RenderActive,
  arrayMove,
  OnSortEnd,
  LoadingSpinner,
  styled,
} from "ol-components"
import { useLearningpathRelationshipMove } from "api/hooks/learningResources"
import CardRowList from "@/components/CardRowList/CardRowList"

const EmptyMessage = styled.p({
  fontStyle: "italic",
})

type ItemsListingProps = {
  items?: LearningPathRelationship[]
  isLoading?: boolean
  isRefetching?: boolean
  emptyMessage: string
  sortable?: boolean
}

const ItemsListingViewOnly: React.FC<{
  items: NonNullable<ItemsListingProps["items"]>
}> = ({ items }) => {
  return (
    <CardRowList>
      {items.map((item) => {
        return (
          <li key={item.id}>
            <LearningResourceCard
              variant="row-reverse"
              resource={item.resource}
            />
          </li>
        )
      })}
    </CardRowList>
  )
}

const ItemsListingSortable: React.FC<{
  items: NonNullable<ItemsListingProps["items"]>
  isRefetching?: boolean
}> = ({ items, isRefetching }) => {
  const move = useLearningpathRelationshipMove()
  /**
   * `sorted` is a local copy of `items`:
   *  - `onSortEnd`, we'll update `sorted` copy immediately to prevent UI from
   *  snapping back to its original position.
   *  - `items` is the source of truth (most likely, this is coming from an API)
   *    so sync `items` -> `sorted` when `items` changes.
   */
  const [sorted, setSorted] = React.useState<LearningPathRelationship[]>([])
  useEffect(() => setSorted(items), [items])
  const renderDragging: RenderActive = useCallback((active) => {
    const item = active.data.current as LearningPathRelationship
    return (
      <LearningResourceCard
        sortable
        suppressImage
        variant="row-reverse"
        resource={item.resource}
      />
    )
  }, [])
  const onSortEnd: OnSortEnd<number> = useCallback(
    async (e) => {
      const active = e.active.data
        .current as unknown as LearningPathRelationship
      const over = e.over.data.current as unknown as LearningPathRelationship
      setSorted((current) => {
        const newOrder = arrayMove(current, e.activeIndex, e.overIndex)
        return newOrder
      })
      move.mutate({
        id: active.id,
        parent: active.parent,
        position: over.position,
      })
    },
    [move],
  )
  const disabled = isRefetching || move.isLoading
  return (
    <CardRowList disabled={disabled}>
      <SortableList
        itemIds={sorted.map((item) => item.id)}
        onSortEnd={onSortEnd}
        renderActive={renderDragging}
      >
        {sorted.map((item) => {
          return (
            <SortableItem
              Component="li"
              key={item.id}
              id={item.id}
              data={item}
              disabled={disabled}
            >
              {(handleProps) => {
                return (
                  <div {...handleProps}>
                    <LearningResourceCard
                      sortable
                      suppressImage
                      variant="row-reverse"
                      resource={item.resource}
                    />
                  </div>
                )
              }}
            </SortableItem>
          )
        })}
      </SortableList>
    </CardRowList>
  )
}

const ItemsListing: React.FC<ItemsListingProps> = ({
  items = [],
  isLoading,
  isRefetching,
  emptyMessage,
  sortable = false,
}) => {
  return (
    <>
      {isLoading && <LoadingSpinner loading />}
      {items.length === 0 ? (
        <EmptyMessage>{emptyMessage}</EmptyMessage>
      ) : sortable ? (
        <ItemsListingSortable items={items} isRefetching={isRefetching} />
      ) : (
        <ItemsListingViewOnly items={items} />
      )}
    </>
  )
}

export default ItemsListing
export type { ItemsListingProps }
