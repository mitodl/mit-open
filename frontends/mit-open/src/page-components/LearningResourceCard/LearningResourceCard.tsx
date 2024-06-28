/*
 * TODO: This has been replaced by the ol-components LearningResourceCard
 * It is still in use by the LearningPathDetailsPage -> ListDetails -> ItemsListing
 * though can be removed (and adjacent LearningResourceCardTemplate) once
 * the sorting functionality has been refactored across
 */
import React, { useCallback } from "react"
import * as NiceModal from "@ebay/nice-modal-react"

import LearningResourceCardTemplate from "@/page-components/LearningResourceCardTemplate/LearningResourceCardTemplate"
import type { LearningResourceCardTemplateProps } from "@/page-components/LearningResourceCardTemplate/LearningResourceCardTemplate"
import { ActionButton, imgConfigs } from "ol-components"
import {
  AddToLearningPathDialog,
  AddToUserListDialog,
} from "../Dialogs/AddToListDialog"
import { LearningResource } from "api"
import { useUserMe } from "api/hooks/user"
import { useOpenLearningResourceDrawer } from "../LearningResourceDrawer/LearningResourceDrawer"

import { RiMenuAddLine, RiBookmarkLine } from "@remixicon/react"

type LearningResourceCardProps = Pick<
  LearningResourceCardTemplateProps<LearningResource>,
  "variant" | "resource" | "className" | "sortable" | "suppressImage"
>

/**
 * Our standard LearningResourceCard component for MIT Open.
 *
 * This is mostly a wrapper around {@link LearningResourceCardTemplate }, which
 * provides no meaningful user interactions on its own. This component connects
 * {@link LearningResourceCardTemplate } to app features like the resource
 * drawer and userlist dialogs.
 *

 */
const LearningResourceCard: React.FC<LearningResourceCardProps> = ({
  resource,
  variant,
  className,
  sortable,
  suppressImage,
}) => {
  const showAddToLearningPathDialog = useCallback(() => {
    NiceModal.show(AddToLearningPathDialog, { resourceId: resource.id })
    return
  }, [resource])
  const showAddToUserListDialog = useCallback(() => {
    NiceModal.show(AddToUserListDialog, { resourceId: resource.id })
    return
  }, [resource])

  const openLRDrawer = useOpenLearningResourceDrawer()
  const { isLoading, data: user } = useUserMe()

  if (isLoading) {
    return null
  }

  return (
    <LearningResourceCardTemplate
      variant={variant}
      sortable={sortable}
      suppressImage={suppressImage}
      className={className}
      resource={resource}
      imgConfig={imgConfigs[variant]}
      onActivate={(r) => openLRDrawer(r.id)}
      footerActionSlot={
        <div>
          {user?.is_authenticated && user?.is_learning_path_editor && (
            <ActionButton
              variant="text"
              edge="circular"
              color="secondary"
              aria-label="Add to Learning Path"
              onClick={showAddToLearningPathDialog}
            >
              <RiMenuAddLine />
            </ActionButton>
          )}
          {user?.is_authenticated && (
            <ActionButton
              variant="text"
              edge="circular"
              color="secondary"
              aria-label="Add to User List"
              onClick={showAddToUserListDialog}
            >
              <RiBookmarkLine />
            </ActionButton>
          )}
        </div>
      }
    />
  )
}

export default LearningResourceCard
export type { LearningResourceCardProps }
