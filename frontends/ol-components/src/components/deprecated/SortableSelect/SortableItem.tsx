import React, { useCallback } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { UniqueIdentifier } from "@dnd-kit/core"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline"
import IconButton from "@mui/material/IconButton"
import "./SortableItem.scss"

interface Props<T> {
  item: T
  id: UniqueIdentifier
  deleteItem: (item: T) => void
  title: string
}

export default function SortableItem<T>(props: Props<T>): JSX.Element {
  const { item, deleteItem, id, title } = props

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const deleteItemCB = useCallback(() => {
    deleteItem(item)
  }, [deleteItem, item])

  return (
    <div className="sortable-item my-1" ref={setNodeRef} style={style}>
      <DragIndicatorIcon {...listeners} {...attributes} />
      <div className="sortable-item-title">{title}</div>
      <IconButton
        aria-label="Remove item"
        color="inherit"
        size="small"
        onClick={deleteItemCB}
      >
        <RemoveCircleOutlineIcon />
      </IconButton>
    </div>
  )
}
