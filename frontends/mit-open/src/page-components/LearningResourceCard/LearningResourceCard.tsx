import React, { useCallback } from "react"
import * as NiceModal from "@ebay/nice-modal-react"
import {
  LearningResourceCardTemplate,
  ActionButton,
  imgConfigs,
} from "ol-components"
import type { LearningResourceCardTemplateProps } from "ol-components"
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd"
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder"
import {
  AddToLearningPathDialog,
  AddToUserListDialog,
} from "@/page-components/AddToListDialog/AddToListDialog"
import { LearningResource } from "api"
import { useUserMe } from "api/hooks/user"

type LearningResourceCardProps = Pick<
  LearningResourceCardTemplateProps<LearningResource>,
  "variant" | "resource" | "className" | "sortable" | "suppressImage"
> & {
  onActivate: (resource: LearningResource) => void
}

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
  onActivate,
}) => {
  const showAddToLearningPathDialog = useCallback(() => {
    NiceModal.show(AddToLearningPathDialog, { resourceId: resource.id })
    return
  }, [resource])
  const showAddToUserListDialog = useCallback(() => {
    NiceModal.show(AddToUserListDialog, { resourceId: resource.id })
    return
  }, [resource])

  const { isLoading, data: user } = useUserMe()
  // const openLRDrawer = useOpenLearningResourceDrawer()

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
      onActivate={onActivate}
      footerActionSlot={
        <div>
          {user?.is_authenticated && user?.is_learning_path_editor && (
            <ActionButton
              variant="text"
              edge="rounded"
              color="secondary"
              aria-label="Add to Learning Path"
              onClick={showAddToLearningPathDialog}
            >
              <PlaylistAddIcon />
            </ActionButton>
          )}
          {user?.is_authenticated && (
            <ActionButton
              variant="text"
              edge="rounded"
              color="secondary"
              aria-label="Add to User List"
              onClick={showAddToUserListDialog}
            >
              <BookmarkBorderIcon />
            </ActionButton>
          )}
        </div>
      }
    />
  )
}

export { LearningResourceCard }
export type { LearningResourceCardProps }
