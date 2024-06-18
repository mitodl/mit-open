import React, { useCallback, useMemo, useState } from "react"
import { LearningResourceCard, LearningResourceListCard } from "ol-components"
import * as NiceModal from "@ebay/nice-modal-react"
import type {
  LearningResourceCardProps,
  LearningResourceListCardProps,
} from "ol-components"
import {
  AddToLearningPathDialog,
  AddToUserListDialog,
} from "../Dialogs/AddToListDialog"
import { useResourceDrawerHref } from "../LearningResourceDrawer/LearningResourceDrawer"
import { useUserMe } from "api/hooks/user"
import { SignupPopover } from "../SignupPopover/SignupPopover"

const useResourceCard = () => {
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

  return {
    getDrawerHref,
    anchorEl,
    handleClosePopover,
    handleAddToLearningPathClick,
    handleAddToUserListClick,
  }
}

type ResourceCardProps = Omit<
  LearningResourceCardProps,
  "href" | "onAddToLearningPathClick" | "onAddToUserListClick"
>

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, ...others }) => {
  const {
    getDrawerHref,
    anchorEl,
    handleClosePopover,
    handleAddToLearningPathClick,
    handleAddToUserListClick,
  } = useResourceCard()
  return (
    <>
      <LearningResourceCard
        resource={resource}
        href={resource ? getDrawerHref(resource.id) : undefined}
        onAddToLearningPathClick={handleAddToLearningPathClick}
        onAddToUserListClick={handleAddToUserListClick}
        {...others}
      />
      <SignupPopover anchorEl={anchorEl} onClose={handleClosePopover} />
    </>
  )
}

type ResourceListCardProps = Omit<
  LearningResourceListCardProps,
  "href" | "onAddToLearningPathClick" | "onAddToUserListClick"
>

const ResourceListCard: React.FC<ResourceListCardProps> = ({
  resource,
  ...others
}) => {
  const {
    getDrawerHref,
    anchorEl,
    handleClosePopover,
    handleAddToLearningPathClick,
    handleAddToUserListClick,
  } = useResourceCard()
  return (
    <>
      <LearningResourceListCard
        resource={resource}
        href={resource ? getDrawerHref(resource.id) : undefined}
        onAddToLearningPathClick={handleAddToLearningPathClick}
        onAddToUserListClick={handleAddToUserListClick}
        {...others}
      />
      <SignupPopover anchorEl={anchorEl} onClose={handleClosePopover} />
    </>
  )
}

export { ResourceCard, ResourceListCard }
export type { ResourceCardProps, ResourceListCardProps }
