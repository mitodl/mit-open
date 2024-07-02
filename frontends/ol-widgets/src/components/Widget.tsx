import React, { useCallback } from "react"
import classNames from "classnames"
import { Divider, MuiCard, CardContent, CardActions } from "ol-components"
import {
  RiPencilFill,
  RiDeleteBin7Fill,
  RiArrowDownSLine,
  RiArrowUpSLine,
} from "@remixicon/react"
import IconDrag from "@mui/icons-material/DragHandle"

import type {
  AnonymousWidget,
  EmbeddedUrlWidgetInstance,
  RichTextWidgetInstance,
} from "../interfaces"
import { WidgetTypes } from "../interfaces"
import RichTextWdigetContent from "./RichTextWidgetContent"
import EmbeddedUrlWidgetContent from "./EmbeddedUrlWidgetContent"
import Styles from "./Styles"

/**
 * Button labels for Widgets.
 *
 * Useful for tests.
 */
const btnLabel = {
  expand: "Show widget content",
  collapse: "Hide widget content",
  edit: "Edit widget",
  delete: "Delete widget",
  move: "Move widget",
}

type WidgetTemplateProps = {
  widget: AnonymousWidget
  isEditing?: boolean
  isOpen?: boolean
  className?: string
  contentClassName?: string
  children: React.ReactNode
  onEdit?: (widget: AnonymousWidget) => void
  onDelete?: (widget: AnonymousWidget) => void
  onVisibilityChange?: (widget: AnonymousWidget) => void
  handleProps?: React.HTMLAttributes<HTMLButtonElement>
}

const WidgetTemplate: React.FC<WidgetTemplateProps> = ({
  widget,
  children,
  className,
  isEditing = false,
  isOpen = true,
  onEdit,
  onDelete,
  onVisibilityChange,
  handleProps,
}) => {
  const handleVisibilityChange = useCallback(() => {
    if (!onVisibilityChange) return
    onVisibilityChange(widget)
  }, [widget, onVisibilityChange])
  const handleEdit = useCallback(() => {
    if (!onEdit) return
    onEdit(widget)
  }, [widget, onEdit])
  const handleDelete = useCallback(() => {
    if (!onDelete) return
    onDelete(widget)
  }, [widget, onDelete])

  if (!isEditing && !isOpen) {
    throw new Error("Collapsed widgets outside of editing mode not supported")
  }

  return (
    <MuiCard
      className={classNames("ol-widget", className, {
        "ol-widget-collapsed": !isOpen,
      })}
    >
      <CardContent>
        <h2 className="ol-widget-header">
          {widget.title}
          {isEditing &&
            (isOpen ? (
              <button
                aria-label={btnLabel.collapse}
                onClick={handleVisibilityChange}
              >
                <RiArrowUpSLine fontSize="inherit" />
              </button>
            ) : (
              <button
                aria-label={btnLabel.expand}
                onClick={handleVisibilityChange}
              >
                <RiArrowDownSLine fontSize="inherit" />
              </button>
            ))}
        </h2>
        {isOpen && children}
      </CardContent>
      {isEditing && (
        <>
          <Divider />
          <CardActions className="ol-widget-actions">
            <button
              aria-label={btnLabel.edit}
              type="button"
              onClick={handleEdit}
            >
              <RiPencilFill fontSize="inherit" />
            </button>
            <button
              aria-label={btnLabel.delete}
              type="button"
              onClick={handleDelete}
            >
              <RiDeleteBin7Fill fontSize="inherit" />
            </button>
            <button aria-label={btnLabel.move} type="button" {...handleProps}>
              <IconDrag fontSize="inherit" />
            </button>
          </CardActions>
        </>
      )}
    </MuiCard>
  )
}

interface WidgetContentProps<W extends AnonymousWidget = AnonymousWidget> {
  className?: string
  widget: W
}
const WidgetContent: React.FC<WidgetContentProps> = ({ className, widget }) => {
  const props = {
    widget,
    className: classNames("ol-widget-content", className),
  }

  if (widget.widget_type === WidgetTypes.RichText) {
    return (
      <RichTextWdigetContent
        {...(props as WidgetContentProps<RichTextWidgetInstance>)}
      />
    )
  }

  if (widget.widget_type === WidgetTypes.EmbeddedUrl) {
    return (
      <EmbeddedUrlWidgetContent
        {...(props as WidgetContentProps<EmbeddedUrlWidgetInstance>)}
      />
    )
  }
  throw new Error(`Unrecognized Widget Type: ${props.widget.widget_type}`)
}

type WidgetProps = Pick<
  WidgetTemplateProps,
  | "isEditing"
  | "isOpen"
  | "className"
  | "contentClassName"
  | "widget"
  | "onEdit"
  | "onDelete"
  | "onVisibilityChange"
  | "handleProps"
>

const Widget: React.FC<WidgetProps> = (props) => {
  return (
    <WidgetTemplate {...props}>
      <Styles />
      <WidgetContent
        className={classNames("ol-widget-content", props.contentClassName)}
        widget={props.widget}
      />
    </WidgetTemplate>
  )
}

export default Widget
export type { WidgetProps }
export { btnLabel }
