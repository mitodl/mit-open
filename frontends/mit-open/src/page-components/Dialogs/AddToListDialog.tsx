import React, { useState } from "react"
import {
  Dialog,
  Chip,
  MuiCheckbox,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  LoadingSpinner,
  styled,
} from "ol-components"

import { RiLockLine, RiLockUnlockLine, RiAddLine } from "@remixicon/react"

import * as NiceModal from "@ebay/nice-modal-react"

import {
  PrivacyLevelEnum,
  type LearningPathResource,
  type LearningResource,
  type UserList,
} from "api"

import {
  useLearningPathsList,
  useLearningResourcesDetail,
  useLearningpathRelationshipCreate,
  useLearningpathRelationshipDestroy,
  useUserListList,
  useUserListRelationshipCreate,
  useUserListRelationshipDestroy,
} from "api/hooks/learningResources"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"
import { ListType } from "api/constants"

const useLearningPathRequestRecord = () => {
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

const useUserListRequestRecord = () => {
  const [pending, setPending] = useState<Map<string, "delete" | "add">>(
    new Map(),
  )
  const key = (resource: LearningResource, list: UserList) =>
    `${resource.id}-${list.id}`
  const get = (resource: LearningResource, list: UserList) =>
    pending.get(key(resource, list))
  const set = (
    resource: LearningResource,
    list: UserList,
    value: "delete" | "add",
  ) => {
    setPending((current) => new Map(current).set(key(resource, list), value))
  }
  const clear = (resource: LearningResource, list: UserList) => {
    setPending((current) => {
      const next = new Map(current)
      next.delete(key(resource, list))
      return next
    })
  }
  return { get, set, clear }
}

const useToggleItemInLearningPath = (resource?: LearningResource) => {
  const requestRecord = useLearningPathRequestRecord()
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

const useToggleItemInUserList = (resource?: LearningResource) => {
  const requestRecord = useUserListRequestRecord()
  const addTo = useUserListRelationshipCreate()
  const deleteFrom = useUserListRelationshipDestroy()
  const handleAdd = async (list: UserList) => {
    if (!resource) return
    requestRecord.set(resource, list, "add")
    try {
      await addTo.mutateAsync({ child: resource.id, parent: list.id })
    } finally {
      requestRecord.clear(resource, list)
    }
  }
  const handleRemove = async (list: UserList) => {
    if (!resource) return
    requestRecord.set(resource, list, "delete")
    const relationship = resource.user_list_parents?.find(
      ({ parent }) => parent === list.id,
    )
    if (!relationship) return // should not happen
    try {
      await deleteFrom.mutateAsync(relationship)
    } finally {
      requestRecord.clear(resource, list)
    }
  }

  const isChecked = (list: UserList): boolean =>
    resource?.user_list_parents?.some(({ parent }) => parent === list.id) ??
    false

  const isAdding = (list: UserList) =>
    !!resource && requestRecord.get(resource, list) === "add"
  const isRemoving = (list: UserList) =>
    !!resource && requestRecord.get(resource, list) === "delete"

  const handleToggle = (list: UserList) => async () => {
    return isChecked(list) ? handleRemove(list) : handleAdd(list)
  }
  return { handleToggle, isChecked, isAdding, isRemoving }
}

const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    width: 600px;
  }

  .MuiDialogContent-root {
    padding: 0;
  }
`

const Description = styled.div({})

const ResourceTitle = styled.span({
  fontStyle: "italic",
})

const Listing = styled(List)`
  & .MuiListItem-root:not(.add-to-list-new) {
    padding: 0;
  }

  .MuiListItemButton-root:not(.add-to-list-new) {
    padding-top: 0;
    padding-bottom: 0;
  }
`

type PrivacyChipProps = {
  publicOption: string
  selectedOption: string | undefined
}
const PrivacyChip: React.FC<PrivacyChipProps> = ({
  publicOption,
  selectedOption,
}) => {
  const isPublic = selectedOption === publicOption
  const icon = isPublic ? <RiLockUnlockLine /> : <RiLockLine />
  return <Chip icon={icon} label={selectedOption} size="medium" />
}

type AddToListDialogInnerProps = {
  listType: ListType
  resource: LearningResource | undefined
  lists: LearningPathResource[] | UserList[]
  isReady: boolean
}
const AddToListDialogInner: React.FC<AddToListDialogInnerProps> = ({
  listType,
  resource,
  lists,
  isReady,
}) => {
  const modal = NiceModal.useModal()
  let dialogTitle = "Add to list"
  if (listType === ListType.LearningPath) {
    dialogTitle = "Add to Learning List"
  } else if (listType === ListType.UserList) {
    dialogTitle = "Add to User List"
  }
  return (
    <StyledDialog
      title={dialogTitle}
      showFooter={false}
      {...NiceModal.muiDialogV5(modal)}
    >
      {isReady ? (
        <>
          <Description>
            Adding <ResourceTitle>{resource?.title}</ResourceTitle>
          </Description>
          {listType === ListType.LearningPath ? (
            <Listing>
              <LearningPathToggleList
                resource={resource}
                lists={lists as LearningPathResource[]}
              />
              <ListItem className="add-to-list-new">
                <ListItemButton
                  onClick={() => manageListDialogs.upsertLearningPath()}
                >
                  <RiAddLine />
                  <ListItemText primary="Create a new list" />
                </ListItemButton>
              </ListItem>
            </Listing>
          ) : null}
          {listType === ListType.UserList ? (
            <Listing>
              <UserListToggleList
                resource={resource}
                lists={lists as UserList[]}
              />
              <ListItem className="add-to-list-new">
                <ListItemButton
                  onClick={() => manageListDialogs.upsertUserList()}
                >
                  <RiAddLine />
                  <ListItemText primary="Create a new list" />
                </ListItemButton>
              </ListItem>
            </Listing>
          ) : null}
        </>
      ) : (
        <LoadingSpinner loading={!isReady} />
      )}
    </StyledDialog>
  )
}

type LearningPathToggleListProps = {
  resource: LearningResource | undefined
  lists: LearningPathResource[]
}
const LearningPathToggleList: React.FC<LearningPathToggleListProps> = ({
  resource,
  lists,
}) => {
  const { handleToggle, isChecked, isAdding, isRemoving } =
    useToggleItemInLearningPath(resource)
  return lists.map((list) => {
    const checked = isChecked(list)
    const adding = isAdding(list)
    const removing = isRemoving(list)
    const disabled = adding || removing
    return (
      <ListItem
        key={list.id}
        secondaryAction={
          <PrivacyChip
            publicOption="Public"
            selectedOption={list.published ? "Public" : "Private"}
          />
        }
      >
        <ListItemButton
          aria-disabled={disabled}
          onClick={disabled ? undefined : handleToggle(list)}
        >
          <MuiCheckbox
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
  })
}

type UserListToggleListProps = {
  resource: LearningResource | undefined
  lists: UserList[]
}
const UserListToggleList: React.FC<UserListToggleListProps> = ({
  resource,
  lists,
}) => {
  const { handleToggle, isChecked, isAdding, isRemoving } =
    useToggleItemInUserList(resource)
  return lists.map((list) => {
    const checked = isChecked(list)
    const adding = isAdding(list)
    const removing = isRemoving(list)
    const disabled = adding || removing
    const privateLevel = PrivacyLevelEnum.Private[0]
      .toUpperCase()
      .concat(PrivacyLevelEnum.Private.slice(1))
    const unlistedLevel = PrivacyLevelEnum.Unlisted[0]
      .toUpperCase()
      .concat(PrivacyLevelEnum.Unlisted.slice(1))
    const privacyLevel = list.privacy_level
      ? list.privacy_level[0].toUpperCase().concat(list.privacy_level.slice(1))
      : privateLevel
    return (
      <ListItem
        key={list.id}
        secondaryAction={
          <PrivacyChip
            publicOption={unlistedLevel}
            selectedOption={privacyLevel}
          />
        }
      >
        <ListItemButton
          aria-disabled={disabled}
          onClick={disabled ? undefined : handleToggle(list)}
        >
          <MuiCheckbox
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
  })
}

type AddToListDialogProps = {
  resourceId: number
}
const AddToLearningPathDialogInner: React.FC<AddToListDialogProps> = ({
  resourceId,
}) => {
  const resourceQuery = useLearningResourcesDetail(resourceId)
  const resource = resourceQuery.data
  const listsQuery = useLearningPathsList()

  const isReady = !!(resource && listsQuery.isSuccess)
  const lists = listsQuery.data?.results ?? []
  return (
    <AddToListDialogInner
      listType={ListType.LearningPath}
      resource={resource}
      lists={lists}
      isReady={isReady}
    />
  )
}

const AddToUserListDialogInner: React.FC<AddToListDialogProps> = ({
  resourceId,
}) => {
  const resourceQuery = useLearningResourcesDetail(resourceId)
  const resource = resourceQuery.data
  const listsQuery = useUserListList()

  const isReady = !!(resource && listsQuery.isSuccess)
  const lists = listsQuery.data?.results ?? []
  return (
    <AddToListDialogInner
      listType={ListType.UserList}
      resource={resource}
      lists={lists}
      isReady={isReady}
    />
  )
}

const AddToLearningPathDialog = NiceModal.create(AddToLearningPathDialogInner)
const AddToUserListDialog = NiceModal.create(AddToUserListDialogInner)

export {
  AddToLearningPathDialog,
  AddToUserListDialog,
  AddToUserListDialogInner,
}
