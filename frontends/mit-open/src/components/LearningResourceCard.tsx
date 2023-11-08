import React, { useCallback } from "react"
import classNames from "classnames"
import * as NiceModal from "@ebay/nice-modal-react"
import { LearningResourceCardTemplate as LearningResourceCardTemplateOld } from "ol-search-ui"
import type {
  LearningResourceCardTemplateProps as LearningResourceCardTemplatePropsOld,
  LearningResource as LearningResourceOld,
  LearningResourceSearchResult,
} from "ol-search-ui"
import { LearningResourceCardTemplate } from "ol-learning-resources"
import type { LearningResourceCardTemplateProps } from "ol-learning-resources"
import { useActivateResourceDrawer } from "./LearningResourceDrawer"
import { deprecatedImgConfig, imgConfigs } from "../util/constants"
import { IconButton } from "ol-design"
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd"
import AddToListDialog from "../pages/learningpaths/AddToListDialog"
import { LearningResource } from "api"

type LearningResourceCardPropsOld = Pick<
  LearningResourceCardTemplatePropsOld<
    LearningResourceOld | LearningResourceSearchResult
  >,
  "variant" | "resource" | "className" | "sortable" | "suppressImage"
>
type LearningResourceCardPropsNew = Pick<
  LearningResourceCardTemplateProps<LearningResource>,
  "variant" | "resource" | "className" | "sortable" | "suppressImage"
>
type LearningResourceCardProps =
  | LearningResourceCardPropsOld
  | LearningResourceCardPropsNew

const isNewStyleResource = (
  resource: LearningResourceCardProps["resource"],
): resource is LearningResource => {
  if ("object_type" in resource) return false
  return true
}

/**
 * Our standard LearningResourceCard component for MIT Open.
 *
 * This is mostly a wrapper around {@link LearningResourceCardTemplate }, which
 * provides no meaningful user interactions on its own. This component connects
 * {@link LearningResourceCardTemplate } to app features like the resource
 * drawer and userlist dialogs.
 *
 * NOTE: This component is currently a bridge between our old and new API formats
 * and *currently* accepts either format in the `resource` prop. Support for the
 * old resource format will be removed in the future.
 */
const LearningResourceCard: React.FC<LearningResourceCardProps> = ({
  resource,
  variant,
  className,
  sortable,
  suppressImage,
}) => {
  const activateResource = useActivateResourceDrawer()
  const showAddToStaffListDialog = useCallback(() => {
    if (isNewStyleResource(resource)) {
      NiceModal.show(AddToListDialog, { resourceId: resource.id })
      return
    }
    throw new Error("Not implemented")
  }, [resource])

  const { user } = window.SETTINGS

  if (isNewStyleResource(resource)) {
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
                onClick={showAddToStaffListDialog}
              >
                <PlaylistAddIcon />
              </IconButton>
            )}
          </div>
        }
      />
    )
  }

  return (
    <>
      <LearningResourceCardTemplateOld
        variant={variant}
        sortable={sortable}
        suppressImage={suppressImage}
        className={classNames("ic-resource-card", className)}
        resource={resource}
        imgConfig={deprecatedImgConfig(imgConfigs[variant])}
        onActivate={activateResource}
      />
    </>
  )
}

export default LearningResourceCard
export type {
  LearningResourceCardProps,
  LearningResourceCardPropsOld,
  LearningResourceCardPropsNew,
}
