import React, { useCallback } from "react"
import classNames from "classnames"
import * as NiceModal from "@ebay/nice-modal-react"

import LearningResourceCardTemplate from "@/page-components/LearningResourceCardTemplate/LearningResourceCardTemplate"
import type { LearningResourceCardTemplateProps } from "@/page-components/LearningResourceCardTemplate/LearningResourceCardTemplate"
import { imgConfigs } from "@/common/constants"
import { IconButton } from "ol-components"
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd"
import AddToListDialog from "./AddToListDialog"
import { LearningResource } from "api"

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
    NiceModal.show(AddToListDialog, { resourceId: resource.id })
    return
  }, [resource])

  const { user } = window.SETTINGS

  return (
    <LearningResourceCardTemplate
      variant={variant}
      sortable={sortable}
      suppressImage={suppressImage}
      className={classNames("ic-resource-card", className)}
      resource={resource}
      imgConfig={imgConfigs[variant]}
      onActivate={console.log}
      footerActionSlot={
        <div>
          {user.is_learning_path_editor && (
            <IconButton
              size="small"
              aria-label="Add to Learning Path"
              onClick={showAddToLearningPathDialog}
            >
              <PlaylistAddIcon />
            </IconButton>
          )}
        </div>
      }
    />
  )
}

export default LearningResourceCard
export type { LearningResourceCardProps }
