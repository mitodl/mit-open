import React, { useCallback, useEffect } from "react"
import type { LearningResource } from "api"
import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"
import {
  SortableItem,
  SortableList,
  RenderActive,
  arrayMove,
  OnSortEnd,
  LoadingSpinner,
  styled,
  PlainList,
} from "ol-components"
import { ResourceListCard } from "@/page-components/ResourceCard/ResourceCard"
import { useListItemMove } from "api/hooks/learningResources"

const EmptyMessage = styled.p({
  fontStyle: "italic",
})

type LearningResourceListItem = {
  id: number
  resource: LearningResource
  position?: number
  parent: number
  child: number
}

type ItemsListingProps = {
  listType: string
  items?: LearningResourceListItem[]
  isLoading?: boolean
  isRefetching?: boolean
  emptyMessage: string
  sortable?: boolean
  condensed?: boolean
}

const ItemsListingViewOnly: React.FC<{
  items: NonNullable<ItemsListingProps["items"]>
  condensed?: boolean
}> = ({ items, condensed }) => {
  return (
    <PlainList itemSpacing={condensed ? 1 : 2}>
      {items.map((item) => {
        return (
          <li key={item.id}>
            <ResourceListCard resource={item.resource} condensed={condensed} />
          </li>
        )
      })}
    </PlainList>
  )
}

const ItemsListingSortable: React.FC<{
  listType: NonNullable<ItemsListingProps["listType"]>
  items: NonNullable<ItemsListingProps["items"]>
  isRefetching?: boolean
}> = ({ listType, items, isRefetching }) => {
  const move = useListItemMove()
  const [sorted, setSorted] = React.useState<LearningResourceListItem[]>([])
  /**
   * `sorted` is a local copy of `items`:
   *  - `onSortEnd`, we'll update `sorted` copy immediately to prevent UI from
   *  snapping back to its original position.
   *  - `items` is the source of truth (most likely, this is coming from an API)
   *    so sync `items` -> `sorted` when `items` changes.
   */
  useEffect(() => setSorted(items), [items])
  const renderDragging: RenderActive = useCallback((active) => {
    const item = active.data.current as LearningResourceListItem
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
        .current as unknown as LearningResourceListItem
      const over = e.over.data.current as unknown as LearningResourceListItem
      setSorted((current) => {
        const newOrder = arrayMove(current, e.activeIndex, e.overIndex)
        return newOrder
      })
      move.mutate({
        listType: listType,
        id: active.id,
        parent: active.parent,
        position: over.position,
      })
    },
    [listType, move],
  )
  const disabled = isRefetching || move.isLoading
  return (
    <PlainList disabled={disabled}>
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
    </PlainList>
  )
}

const ItemsListing: React.FC<ItemsListingProps> = ({
  listType,
  items = [],
  isLoading,
  isRefetching,
  emptyMessage,
  sortable = false,
  condensed = false,
}) => {
  return (
    <>
      {isLoading ? (
        <LoadingSpinner loading />
      ) : items.length === 0 ? (
        <EmptyMessage>{emptyMessage}</EmptyMessage>
      ) : sortable ? (
        <ItemsListingSortable
          listType={listType}
          items={items}
          isRefetching={isRefetching}
        />
      ) : (
        <ItemsListingViewOnly items={items} condensed={condensed} />
      )}
    </>
  )
}

export default ItemsListing
export type { ItemsListingProps, LearningResourceListItem }
