import React from "react"
import { createRoot } from "react-dom/client"
import { AddToUserListDialogInner } from "@/page-components/Dialogs/AddToListDialog"
import NiceModal from "@ebay/nice-modal-react"
import { createQueryClient } from "@/services/react-query/react-query"
import ExportedComponentProviders from "@/ExportedComponentProviders"
import { useLearningResourcesList } from "api/hooks/learningResources"

const initMitOpenDom = (container: HTMLElement) => {
  const root = createRoot(container)
  const queryClient = createQueryClient()
  return root.render(<ExportedComponentProviders queryClient={queryClient} />)
}

type ExportedDialogProps = {
  readableId: string
}

const AddToUserListDialogComponent: React.FC<ExportedDialogProps> = ({
  readableId,
}) => {
  const resourcesQuery = useLearningResourcesList({ readable_id: [readableId] })
  const response = resourcesQuery.data ?? null
  if (response === null) return null
  const resourceId = response.results[0].id
  return (
    <AddToUserListDialogInner
      resourceId={resourceId}
    ></AddToUserListDialogInner>
  )
}

const openAddToUserListDialog = (readableId: string) => {
  const addToUserListDialog = NiceModal.create(AddToUserListDialogComponent)
  NiceModal.show(addToUserListDialog, { readableId })
}

export { initMitOpenDom, openAddToUserListDialog }
