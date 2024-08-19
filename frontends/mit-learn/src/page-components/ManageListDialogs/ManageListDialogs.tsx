import React, { useCallback } from "react"
import { useFormik, FormikConfig } from "formik"
import * as NiceModal from "@ebay/nice-modal-react"
import { RiDeleteBinLine } from "@remixicon/react"
import {
  Alert,
  TextField,
  Autocomplete,
  FormDialog,
  Dialog,
  MenuItem,
  Button,
} from "ol-components"
import * as Yup from "yup"
import { type LearningPathResource, UserList } from "api"

import {
  useLearningpathCreate,
  useLearningpathUpdate,
  useLearningpathDestroy,
  useLearningResourceTopics,
  useUserListCreate,
  useUserListUpdate,
  useUserListDestroy,
} from "api/hooks/learningResources"

const learningPathFormSchema = Yup.object().shape({
  published: Yup.boolean()
    .default(false)
    .required("Published is a required field"),
  title: Yup.string().default("").required("Title is required"),
  description: Yup.string().default("").required("Description is required"),
  topics: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.number().required(),
        name: Yup.string().required(),
        channel_url: Yup.string().nullable().required(),
      }),
    )
    .min(1, "Select between 1 and 3 subjects")
    .max(3, "Select between 1 and 3 subjects")
    .default([])
    .nonNullable()
    .required(),
})

const userListFormSchema = Yup.object().shape({
  title: Yup.string().default("").required("Title is required"),
  description: Yup.string().default("").required("Description is required"),
})

type LearningPathFormValues = Yup.InferType<typeof learningPathFormSchema>
type UserListFormValues = Yup.InferType<typeof userListFormSchema>

const variantProps = { InputLabelProps: { shrink: true } }

interface UpsertLearningPathDialogProps {
  title: string
  resource?: LearningPathResource | null
}

const UpsertLearningPathDialog = NiceModal.create(
  ({ resource, title }: UpsertLearningPathDialogProps) => {
    const modal = NiceModal.useModal()
    const topicsQuery = useLearningResourceTopics(undefined, {
      enabled: modal.visible,
    })
    const createList = useLearningpathCreate()
    const updateList = useLearningpathUpdate()
    const mutation = resource?.id ? updateList : createList
    const handleSubmit: FormikConfig<
      LearningPathResource | LearningPathFormValues
    >["onSubmit"] = useCallback(
      async (values) => {
        if (resource?.id) {
          await updateList.mutateAsync({ ...values, id: resource.id })
        } else {
          await createList.mutateAsync(values)
        }
        modal.hide()
      },
      [resource, createList, updateList, modal],
    )

    const formik = useFormik({
      enableReinitialize: true,
      initialValues:
        resource ??
        (learningPathFormSchema.getDefault() as LearningPathFormValues),
      validationSchema: learningPathFormSchema,
      onSubmit: handleSubmit,
      validateOnChange: false,
      validateOnBlur: false,
    })

    const topics = topicsQuery.data?.results ?? []

    return (
      <FormDialog
        {...NiceModal.muiDialogV5(modal)}
        title={title}
        fullWidth
        formClassName="manage-list-form"
        onReset={formik.resetForm}
        onSubmit={formik.handleSubmit}
        confirmText="Save"
        noValidate
        footerContent={
          mutation.isError &&
          !formik.isSubmitting && (
            <Alert severity="error">
              There was a problem saving your list. Please try again later.
            </Alert>
          )
        }
      >
        <TextField
          required
          name="title"
          label="Title"
          placeholder="List Title"
          value={formik.values.title}
          error={!!formik.errors.title}
          errorText={formik.errors.title}
          onChange={formik.handleChange}
          {...variantProps}
          fullWidth
        />
        <TextField
          required
          label="Description"
          name="description"
          placeholder="List Description"
          value={formik.values.description}
          error={!!formik.errors.description}
          errorText={formik.errors.description}
          onChange={formik.handleChange}
          {...variantProps}
          fullWidth
          multiline
          minRows={3}
        />
        <Autocomplete
          multiple
          options={topics}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={(option) => option.name}
          value={formik.values.topics ?? []}
          loading={topicsQuery.isLoading}
          onChange={(_event, value) => formik.setFieldValue("topics", value)}
          renderInput={({ size, ...params }) => (
            <TextField
              {...params}
              required
              error={!!formik.errors.topics}
              errorText={formik.errors.topics as string | undefined}
              label="Subjects"
              name="topics"
              placeholder={
                formik.values.topics?.length
                  ? undefined
                  : "Pick 1 to 3 subjects"
              }
            />
          )}
          renderOption={(props, opt) => {
            return <MenuItem {...props}>{opt.name}</MenuItem>
          }}
        />
      </FormDialog>
    )
  },
)

interface UpsertUserListDialogProps {
  title: string
  userList?: UserList | null
  onDestroy?: () => void
}

const UpsertUserListDialog = NiceModal.create(
  ({ userList, title, onDestroy }: UpsertUserListDialogProps) => {
    const modal = NiceModal.useModal()
    const createList = useUserListCreate()
    const updateList = useUserListUpdate()
    const mutation = userList?.id ? updateList : createList
    const handleSubmit: FormikConfig<
      UserList | UserListFormValues
    >["onSubmit"] = useCallback(
      async (values) => {
        if (userList?.id) {
          await updateList.mutateAsync({ ...values, id: userList.id })
        } else {
          await createList.mutateAsync(values)
        }
        modal.hide()
      },
      [userList, createList, updateList, modal],
    )

    const formik = useFormik({
      enableReinitialize: true,
      initialValues:
        userList ?? (userListFormSchema.getDefault() as UserListFormValues),
      validationSchema: userListFormSchema,
      onSubmit: handleSubmit,
      validateOnChange: false,
      validateOnBlur: false,
    })

    return (
      <FormDialog
        {...NiceModal.muiDialogV5(modal)}
        title={title}
        fullWidth
        formClassName="manage-list-form"
        onReset={formik.resetForm}
        onSubmit={formik.handleSubmit}
        confirmText={userList ? "Update" : "Create"}
        noValidate
        footerContent={
          mutation.isError &&
          !formik.isSubmitting && (
            <Alert severity="error">
              There was a problem saving your list. Please try again later.
            </Alert>
          )
        }
      >
        <TextField
          required
          name="title"
          label="Title"
          placeholder="My list of favorite courses"
          value={formik.values.title}
          error={!!formik.errors.title}
          errorText={formik.errors.title}
          onChange={formik.handleChange}
          {...variantProps}
          fullWidth
        />
        <TextField
          required
          label="Description"
          name="description"
          placeholder="List of all courses I wanted to check out"
          value={formik.values.description}
          error={!!formik.errors.description}
          errorText={formik.errors.description}
          onChange={formik.handleChange}
          {...variantProps}
          fullWidth
          multiline
          minRows={3}
        />
        {userList && (
          <div>
            <Button
              variant="tertiary"
              edge="rounded"
              size="small"
              startIcon={<RiDeleteBinLine />}
              disabled={formik.isSubmitting}
              onClick={() => {
                modal.hide()
                manageListDialogs.destroyUserList(userList!, onDestroy)
              }}
            >
              Delete
            </Button>
          </div>
        )}
      </FormDialog>
    )
  },
)

type DeleteLearningPathDialogProps = {
  resource: LearningPathResource
}

const DeleteLearningPathDialog = NiceModal.create(
  ({ resource }: DeleteLearningPathDialogProps) => {
    const modal = NiceModal.useModal()
    const hideModal = modal.hide
    const destroyList = useLearningpathDestroy()

    const handleConfirm = useCallback(async () => {
      await destroyList.mutateAsync({
        id: resource.id,
      })
      hideModal()
    }, [destroyList, hideModal, resource])
    return (
      <Dialog
        {...NiceModal.muiDialogV5(modal)}
        onConfirm={handleConfirm}
        title="Delete Learning Path"
        confirmText="Yes, delete"
      >
        Are you sure you want to delete this list?
      </Dialog>
    )
  },
)

type DeleteUserListDialogProps = {
  userList: UserList
  onDestroy?: () => void
}

const DeleteUserListDialog = NiceModal.create(
  ({ userList, onDestroy }: DeleteUserListDialogProps) => {
    const modal = NiceModal.useModal()
    const hideModal = modal.hide
    const destroyList = useUserListDestroy()

    const handleConfirm = useCallback(async () => {
      await destroyList.mutateAsync({
        id: userList.id,
      })
      hideModal()
      onDestroy?.()
    }, [destroyList, hideModal, userList, onDestroy])

    return (
      <Dialog
        {...NiceModal.muiDialogV5(modal)}
        onConfirm={handleConfirm}
        title="Delete List"
        confirmText="Yes, delete"
      >
        Are you sure you want to delete this list?
      </Dialog>
    )
  },
)

const manageListDialogs = {
  upsertLearningPath: (resource?: LearningPathResource) => {
    const title = resource ? "Edit Learning Path" : "Create Learning Path"
    NiceModal.show(UpsertLearningPathDialog, { title, resource })
  },
  destroyLearningPath: (resource: LearningPathResource) =>
    NiceModal.show(DeleteLearningPathDialog, { resource }),
  upsertUserList: (userList?: UserList, onDestroy?: () => void) => {
    const title = userList ? "Edit List" : "Create List"
    NiceModal.show(UpsertUserListDialog, { title, userList, onDestroy })
  },
  destroyUserList: (userList: UserList, onDestroy?: () => void) =>
    NiceModal.show(DeleteUserListDialog, { userList, onDestroy }),
}

export { manageListDialogs }
