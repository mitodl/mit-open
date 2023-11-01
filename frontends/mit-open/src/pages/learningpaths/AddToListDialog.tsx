import React, { useState } from "react"
import {
  BasicDialog,
  IconButton,
  Chip,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  LoadingSpinner,
} from "ol-design"
import CloseIcon from "@mui/icons-material/Close"

import LockOpenIcon from "@mui/icons-material/LockOpen"
import LockIcon from "@mui/icons-material/Lock"

import AddIcon from "@mui/icons-material/Add"
import * as NiceModal from "@ebay/nice-modal-react"

import type { LearningPathResource, LearningResource } from "api"

import {
  useLearningPathsList,
  useLearningResourcesDetail,
  useLearningpathRelationshipCreate,
  useLearningpathRelationshipDestroy,
} from "api/hooks/learningResources"
import { manageListDialogs } from "./ManageListDialogs"

const topRightStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
}

type AddToListDialogProps = {
  resourceId: number
}

const useRequestRecord = () => {
  const [pending, setPending] = useState<Map<string, "delete" | "add">>(
    new Map(),
  )
  const key = (resource: LearningResource, list: LearningPathResource) =>
    `${resource.id}-${list.id}`
  const get = (resource: LearningResource, list: LearningPathResource) =>
    pending.get(key(resource, list))
  const set = (
    resource: LearningResource,
    list: LearningPathResource,
    value: "delete" | "add",
  ) => {
    setPending((current) => new Map(current).set(key(resource, list), value))
  }
  const clear = (resource: LearningResource, list: LearningPathResource) => {
    setPending((current) => {
      const next = new Map(current)
      next.delete(key(resource, list))
      return next
    })
  }
  return { get, set, clear }
}

const useToggleItemInList = (resource?: LearningResource) => {
  const requestRecord = useRequestRecord()
  const addTo = useLearningpathRelationshipCreate()
  const deleteFrom = useLearningpathRelationshipDestroy()
  const handleAdd = async (list: LearningPathResource) => {
    if (!resource) return
    requestRecord.set(resource, list, "add")
    try {
      await addTo.mutateAsync({ child: resource.id, parent: list.id })
    } finally {
      requestRecord.clear(resource, list)
    }
  }
  const handleRemove = async (list: LearningPathResource) => {
    if (!resource) return
    requestRecord.set(resource, list, "delete")
    const relationship = resource.learning_path_parents?.find(
      ({ parent }) => parent === list.id,
    )
    if (!relationship) return // should not happen
    try {
      await deleteFrom.mutateAsync(relationship)
    } finally {
      requestRecord.clear(resource, list)
    }
  }

  const isChecked = (list: LearningPathResource): boolean =>
    resource?.learning_path_parents?.some(({ parent }) => parent === list.id) ??
    false

  const isAdding = (list: LearningPathResource) =>
    !!resource && requestRecord.get(resource, list) === "add"
  const isRemoving = (list: LearningPathResource) =>
    !!resource && requestRecord.get(resource, list) === "delete"

  const handleToggle = (list: LearningPathResource) => async () => {
    return isChecked(list) ? handleRemove(list) : handleAdd(list)
  }
  return { handleToggle, isChecked, isAdding, isRemoving }
}

type PrivacyChipProps = { isPublic?: boolean }
const PrivacyChip: React.FC<PrivacyChipProps> = ({ isPublic = false }) => {
  const icon = isPublic ? <LockOpenIcon /> : <LockIcon />
  const label = isPublic ? "Public" : "Private"
  return <Chip icon={icon} label={label} size="small" />
}

const AddToListDialogInner: React.FC<AddToListDialogProps> = ({
  resourceId,
}) => {
  const modal = NiceModal.useModal()
  const resourceQuery = useLearningResourcesDetail(resourceId)
  const resource = resourceQuery.data
  const listsQuery = useLearningPathsList()

  const { handleToggle, isChecked, isAdding, isRemoving } =
    useToggleItemInList(resource)

  const isReady = resource && listsQuery.isSuccess
  const lists = listsQuery.data?.results ?? []

  return (
    <BasicDialog
      className="add-to-list-dialog"
      title="Add to Learning List"
      showFooter={false}
      {...NiceModal.muiDialogV5(modal)}
    >
      {isReady ? (
        <>
          <div className="add-to-list-description">
            Adding{" "}
            <span className="resource-title-inline">{resource.title}</span>
          </div>
          <List className="add-to-list-listing">
            {lists.map((list) => {
              const adding = isAdding(list)
              const removing = isRemoving(list)
              const disabled = adding || removing
              const checked = adding || isChecked(list)
              return (
                <ListItem
                  key={list.id}
                  secondaryAction={<PrivacyChip isPublic={list.published} />}
                >
                  <ListItemButton
                    aria-disabled={disabled}
                    onClick={disabled ? undefined : handleToggle(list)}
                  >
                    <Checkbox
                      edge="start"
                      disabled={disabled}
                      checked={checked}
                      tabIndex={-1}
                      disableRipple
                    />
                    <ListItemText primary={list.title} />
                  </ListItemButton>
                </ListItem>
              )
            })}
            <ListItem className="add-to-list-new">
              <ListItemButton onClick={() => manageListDialogs.upsert()}>
                <AddIcon />
                <ListItemText primary="Create a new list" />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      ) : (
        <LoadingSpinner loading={!isReady} />
      )}
    </BasicDialog>
  )
}

const AddToListDialog = NiceModal.create(AddToListDialogInner)

export default AddToListDialog
export type { AddToListDialogProps }
