import React, { useId, useState } from "react"
import {
  Dialog,
  Chip,
  MuiCheckbox,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  LoadingSpinner,
  Typography,
  styled,
  CheckboxChoiceField,
  Button,
} from "ol-components"

import { RiLockLine, RiLockUnlockLine, RiAddLine } from "@remixicon/react"

import * as NiceModal from "@ebay/nice-modal-react"

import {
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
  useUserListSetAllRelationships,
} from "api/hooks/learningResources"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"
import { ListType } from "api/constants"
import { useFormik } from "formik"

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
  const setUserListRelationships = useUserListSetAllRelationships()
  let dialogTitle = "Add to list"
  if (listType === ListType.LearningPath) {
    dialogTitle = "Add to Learning List"
  } else if (listType === ListType.UserList) {
    dialogTitle = "Add to User List"
  }
  const listChoices = lists.map((list) => ({
    value: list.id.toString(),
    label: list.title,
  }))
  const learningPathValues = lists
    .map((list) =>
      resource?.learning_path_parents?.some(({ parent }) => parent === list.id)
        ? list.id.toString()
        : null,
    )
    .filter((value) => value !== null)
  const userListValues = lists
    .map((list) =>
      resource?.user_list_parents?.some(({ parent }) => parent === list.id)
        ? list.id.toString()
        : null,
    )
    .filter((value) => value !== null)
  const formId = useId()
  const formik = useFormik({
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: {
      learning_paths: learningPathValues,
      user_lists: userListValues,
    },
    onSubmit: () => {},
  })
  const save = async (values: { learning_paths: string[]; user_lists: string[] }) => {
    if (formik.dirty) {
      console.log(values)
      if (listType === ListType.LearningPath) {
      }
      else if (listType === ListType.UserList) {
        if (resource) {
          const newParents = values.user_lists.map((id) => parseInt(id))
          const removedParents = listChoices.map((list) => list.value).filter((id) => !newParents.includes(parseInt(id)))
          await setUserListRelationships.mutateAsync({
            child: resource.id,
            add_parents: newParents,
            remove_parents: removedParents
          })
      }
    }
  }

  return (
    <Dialog
      title={dialogTitle}
      showFooter={false}
      fullWidth
      {...NiceModal.muiDialogV5(modal)}
    >
      {isReady ? (
        <form id={formId} onSubmit={formik.handleSubmit}>
          <Typography variant="body1">
            Adding <ResourceTitle>{resource?.title}</ResourceTitle>
          </Typography>
          {listType === ListType.LearningPath ? (
              <CheckboxChoiceField
                name="learning_paths"
                choices={listChoices}
                label={""}
                values={formik.values.learning_paths}
                onChange={formik.handleChange}
                vertical
              />
          ) : null}
          {listType === ListType.UserList ? (
              <CheckboxChoiceField
                name="user_lists"
                choices={listChoices}
                label={""}
                values={formik.values.user_lists}
                onChange={formik.handleChange}
                vertical
              />
          ) : null}
          <div>
            <Button
              variant="primary"
              onClick={() => save(formik.values)}
              disabled={!formik.dirty}
            >
              Save
            </Button>
            <Button
              variant="secondary"
              startIcon={<RiAddLine />}
              disabled={formik.isSubmitting}
            >
              Create New List
            </Button>
          </div>
        </form>
      ) : (
        <LoadingSpinner loading={!isReady} />
      )}
    </Dialog>
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
    return (
      <ListItem key={list.id}>
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
