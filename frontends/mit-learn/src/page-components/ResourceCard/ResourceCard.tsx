import React, { useCallback, useMemo, useState } from "react"
import {
  LearningResourceCard,
  LearningResourceListCard,
  LearningResourceListCardCondensed,
  SignupPopover,
} from "ol-components"
import * as NiceModal from "@ebay/nice-modal-react"
import type { LearningResourceCardProps } from "ol-components"
import {
  AddToLearningPathDialog,
  AddToUserListDialog,
} from "../Dialogs/AddToListDialog"
import { useResourceDrawerHref } from "../LearningResourceDrawer/LearningResourceDrawer"
import { useUserMe } from "api/hooks/user"
import { LearningResource } from "api"
import * as urls from "@/common/urls"
import { useLocation } from "react-router"

const useResourceCard = (resource?: LearningResource | null) => {
  const getDrawerHref = useResourceDrawerHref()
  const { data: user } = useUserMe()

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const handleClosePopover = useCallback(() => {
    setAnchorEl(null)
  }, [])
  const handleAddToLearningPathClick: LearningResourceCardProps["onAddToLearningPathClick"] =
    useMemo(() => {
      if (user?.is_authenticated && user?.is_learning_path_editor) {
        return (event, resourceId: number) => {
          NiceModal.show(AddToLearningPathDialog, { resourceId })
        }
      }
      return null
    }, [user])

  const handleAddToUserListClick: LearningResourceCardProps["onAddToUserListClick"] =
    useMemo(() => {
      if (!user) {
        // user info is still loading
        return null
      }
      if (user.is_authenticated) {
        return (event, resourceId: number) => {
          NiceModal.show(AddToUserListDialog, { resourceId })
        }
      }
      return (event) => {
        setAnchorEl(event.currentTarget)
      }
    }, [user])

  const inUserList = !!resource?.user_list_parents?.length
  const inLearningPath = !!resource?.learning_path_parents?.length

  return {
    getDrawerHref,
    anchorEl,
    handleClosePopover,
    handleAddToLearningPathClick,
    handleAddToUserListClick,
    inUserList,
    inLearningPath,
  }
}

type ResourceCardProps = Omit<
  LearningResourceCardProps,
  "href" | "onAddToLearningPathClick" | "onAddToUserListClick"
> & {
  condensed?: boolean
  list?: boolean
}

/**
 * Just like `ol-components/LearningResourceCard`, but with builtin actions:
 *  - click opens the Resource Drawer
 *  - onAddToListClick opens the Add to List modal
 *    - for unauthenticated users, a popover prompts signup instead.
 *  - onAddToLearningPathClick opens the Add to Learning Path modal
 */
const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  condensed,
  list,
  ...others
}) => {
  const loc = useLocation()
  const {
    getDrawerHref,
    anchorEl,
    handleClosePopover,
    handleAddToLearningPathClick,
    handleAddToUserListClick,
    inUserList,
    inLearningPath,
  } = useResourceCard(resource)
  const CardComponent =
    list && condensed
      ? LearningResourceListCardCondensed
      : list
        ? LearningResourceListCard
        : LearningResourceCard
  return (
    <>
      <CardComponent
        resource={resource}
        href={resource ? getDrawerHref(resource.id) : undefined}
        onAddToLearningPathClick={handleAddToLearningPathClick}
        onAddToUserListClick={handleAddToUserListClick}
        inUserList={inUserList}
        inLearningPath={inLearningPath}
        {...others}
      />
      <SignupPopover
        signupUrl={urls.login({
          pathname: loc.pathname,
          search: loc.search,
        })}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
      />
    </>
  )
}

export { ResourceCard }
export type { ResourceCardProps }
