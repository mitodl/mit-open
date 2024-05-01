import React from "react"
import { createRoot } from "react-dom/client"
import { AddToUserListDialog } from "@/page-components/LearningResourceCard/AddToListDialog"
import NiceModal from "@ebay/nice-modal-react"
import { createQueryClient } from "@/services/react-query/react-query"
import ExportedComponentProviders from "@/ExportedComponentProviders"

const prepareModals = (container: HTMLElement) => {
  const root = createRoot(container)

  const queryClient = createQueryClient()

  root.render(<ExportedComponentProviders queryClient={queryClient} />)
}

const openAddToListDialog = (resourceId: number) => {
  NiceModal.show(AddToUserListDialog, { resourceId })
}

// // @ts-expect-error
// window.prepareModals = prepareModals
// // @ts-expect-error
// window.openAddToListDialog = openAddToListDialog

export { prepareModals, openAddToListDialog }
