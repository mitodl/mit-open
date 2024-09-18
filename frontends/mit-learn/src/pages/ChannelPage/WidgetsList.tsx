import React, { useCallback } from "react"
import {
  Widget,
  WidgetsListEditable,
  WidgetsListEditableProps,
  WidgetDialogClasses,
  AnonymousWidget,
  WidgetListResponse,
} from "ol-widgets"
import { WidgetInstance } from "api/v0"
import { useMutateWidgetsList, useWidgetList } from "api/hooks/widget_lists"
import { styled } from "ol-components"

interface WidgetsListProps {
  isEditing: boolean
  widgetListId: number
  className?: string
  onFinishEditing?: () => void
}

const dialogClasses: WidgetDialogClasses = {
  dialog: "ic-widget-editing-dialog",
  field: "form-field",
  error: "validation-message",
  label: "field-label",
  detail: "field-detail",
  fieldGroup: "form-item",
}

export const WidgetListStyles = styled.div`
  .ic-widget {
    .ol-markdown {
      a {
        word-break: break-word;
        color: theme.$link-blue;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    margin-bottom: 5px;
  }

  .ic-widget-editing-header {
    h4 {
      margin-top: 0;
    }
  }
`

const WidgetsList: React.FC<WidgetsListProps> = ({
  widgetListId,
  isEditing,
  onFinishEditing,
  className,
}) => {
  const widgetsQuery = useWidgetList(widgetListId)
  const mutation = useMutateWidgetsList(widgetListId)
  const widgets = widgetsQuery.data?.widgets ?? []
  const onSubmit: WidgetsListEditableProps["onSubmit"] = useCallback(
    (event) => {
      if (event.touched) {
        mutation.mutate(event.widgets as WidgetInstance[], {
          onSuccess: () => {
            if (onFinishEditing) onFinishEditing()
          },
        })
      } else {
        if (onFinishEditing) onFinishEditing()
      }
    },
    [onFinishEditing, mutation],
  )
  const onCancel: WidgetsListEditableProps["onCancel"] = useCallback(() => {
    if (onFinishEditing) onFinishEditing()
  }, [onFinishEditing])
  return (
    <WidgetListStyles>
      <section className={className}>
        {isEditing
          ? widgetsQuery.data && (
              <WidgetsListEditable
                widgetsList={widgetsQuery.data as WidgetListResponse}
                onSubmit={onSubmit}
                onCancel={onCancel}
                headerClassName="ic-widget-editing-header"
                widgetClassName="ic-widget"
                dialogClasses={dialogClasses}
              />
            )
          : widgets.map((widget) => (
              <Widget
                key={widget.id}
                widget={widget as AnonymousWidget}
                isEditing={false}
                className="ic-widget"
              />
            ))}
      </section>
    </WidgetListStyles>
  )
}

export default WidgetsList
