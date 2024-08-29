import React, { useCallback } from "react"
import {
  LoadingSpinner,
  Typography,
  styled,
  CheckboxChoiceField,
  Button,
  FormDialog,
  DialogActions,
} from "ol-components"

import { RiAddLine } from "@remixicon/react"

import * as NiceModal from "@ebay/nice-modal-react"

import {
  type LearningPathResource,
  type LearningResource,
  type UserList,
} from "api"

import {
  useLearningResourceSetUserListRelationships,
  useLearningPathsList,
  useLearningResourcesDetail,
  useUserListList,
  useLearningResourceSetLearningPathRelationships,
} from "api/hooks/learningResources"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"
import { ListType } from "api/constants"
import { useFormik } from "formik"

const ResourceTitle = styled.span({
  fontStyle: "italic",
})

const Actions = styled(DialogActions)({
  display: "flex",
  "> *": { flex: 1 },
})

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
  const handleCreate = useCallback(() => {
    if (listType === ListType.LearningPath) {
      manageListDialogs.upsertLearningPath()
    } else if (listType === ListType.UserList) {
      manageListDialogs.upsertUserList()
    }
  }, [listType])
  const {
    isLoading: isSavingUserListRelationships,
    mutateAsync: setUserListRelationships,
  } = useLearningResourceSetUserListRelationships()
  const {
    isLoading: isSavingLearningPathRelationships,
    mutateAsync: setLearningPathRelationships,
  } = useLearningResourceSetLearningPathRelationships()
  const isSaving =
    isSavingLearningPathRelationships || isSavingUserListRelationships
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
  const formik = useFormik({
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
    initialValues: {
      learning_paths: learningPathValues,
      user_lists: userListValues,
    },
    onSubmit: async (values) => {
      if (resource) {
        if (listType === ListType.LearningPath) {
          const newParents = values.learning_paths.map((id) => parseInt(id))
          await setLearningPathRelationships({
            id: resource.id,
            learning_path_id: newParents,
          })
        } else if (listType === ListType.UserList) {
          const newParents = values.user_lists.map((id) => parseInt(id))
          await setUserListRelationships({
            id: resource.id,
            userlist_id: newParents,
          })
        }
        modal.remove()
      }
    },
  })

  return (
    <FormDialog
      title={dialogTitle}
      fullWidth
      onReset={formik.resetForm}
      onSubmit={formik.handleSubmit}
      {...NiceModal.muiDialogV5(modal)}
      actions={
        <Actions>
          <Button
            variant="primary"
            type="submit"
            disabled={!formik.dirty || isSaving}
          >
            Save
          </Button>
          <Button
            variant="secondary"
            startIcon={<RiAddLine />}
            disabled={isSaving}
            onClick={handleCreate}
          >
            Create New List
          </Button>
        </Actions>
      }
    >
      {isReady ? (
        <>
          <Typography variant="button">
            Adding <ResourceTitle>{resource?.title}</ResourceTitle>
          </Typography>

          {listType === ListType.LearningPath ? (
            <CheckboxChoiceField
              name="learning_paths"
              choices={listChoices}
              values={formik.values.learning_paths}
              onChange={formik.handleChange}
              vertical
            />
          ) : null}
          {listType === ListType.UserList ? (
            <CheckboxChoiceField
              name="user_lists"
              choices={listChoices}
              values={formik.values.user_lists}
              onChange={formik.handleChange}
              vertical
            />
          ) : null}
        </>
      ) : (
        <LoadingSpinner loading={!isReady} />
      )}
    </FormDialog>
  )
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
