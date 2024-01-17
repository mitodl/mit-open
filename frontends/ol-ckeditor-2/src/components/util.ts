import { useEffect } from "react"
import type { Editor } from "@ckeditor/ckeditor5-core"
import { PendingActions } from "@ckeditor/ckeditor5-core"

type OnChangePendingActionsProps = {
  editor: Editor | null
  onChange?: (hasPendingActions: boolean) => void
}

const useOnChangePendingActions = ({
  editor,
  onChange,
}: OnChangePendingActionsProps) => {
  useEffect(() => {
    if (!editor) return
    if (!onChange) return
    const pendingActions = editor.plugins.get(PendingActions)
    const handler = () => {
      onChange(pendingActions.hasAny)
    }
    pendingActions.on("change:hasAny", handler)
    return () => {
      pendingActions.off("change:hasAny", handler)
    }
  }, [editor, onChange])
}

export { useOnChangePendingActions }
