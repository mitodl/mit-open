import React, { useCallback } from "react"
import { useFormik, FormikConfig } from "formik"
import * as NiceModal from "@ebay/nice-modal-react"
import {
  Alert,
  TextField,
  Autocomplete,
  BooleanRadioChoiceField,
  FormDialog,
  BasicDialog,
  styled,
  RadioChoiceField,
} from "ol-components"
import * as Yup from "yup"
import { PrivacyLevelEnum, type LearningPathResource, UserList } from "api"

import {
  useLearningpathCreate,
  useLearningpathUpdate,
  useLearningpathDestroy,
  useLearningResourceTopics,
  useUserListCreate,
  useUserListUpdate,
  useUserListDestroy,
} from "api/hooks/learningResources"

/*
  TODO Refactor to avoid passing classnames to nested components
  We should at minimum be able to target child components within the css
  or access and pass the generated classname dynamically, see
  https://emotion.sh/docs/styled#targeting-another-emotion-component
*/
const StyledFormDialog = styled(FormDialog)`
  .manage-list-form {
    .radio-option {
      .MuiFormControlLabel-label {
        width: 150px;
      }

      .option-header {
        font-weight: bold;
        font-size: theme.$font-normal;
        display: block;
      }

      .option-detail {
        font-size: theme.$font-sm;
      }
    }
  }
`

const learningPathFormSchema = Yup.object().shape({
  published: Yup.boolean()
    .default(false)
    .required("Published is a required field."),
  title: Yup.string().default("").required("Title is required."),
  description: Yup.string().default("").required("Description is required."),
  topics: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.number().required(),
        name: Yup.string().required(),
        full_name: Yup.string().nullable().required(),
        channel_url: Yup.string().nullable().required(),
      }),
    )
    .min(1, "Select between 1 and 3 subjects.")
    .max(3, "Select between 1 and 3 subjects.")
    .default([])
    .nonNullable()
    .required(),
})

const userListFormSchema = Yup.object().shape({
  privacy_level: Yup.string()
    .oneOf(Object.values(PrivacyLevelEnum))
    .default(PrivacyLevelEnum.Private)
    .required("Privacy Level is required"),
  title: Yup.string().default("").required("Title is required."),
  description: Yup.string().default("").required("Description is required."),
})

const LEARNING_PATH_PRIVACY_CHOICES = [
  {
    value: false,
    label: "Private",
    className: "radio-option",
  },
  {
    value: true,
    label: "Public",
    className: "radio-option",
  },
]

const USER_LIST_PRIVACY_CHOICES = [
  {
    value: PrivacyLevelEnum.Private,
    label: "Private",
    className: "radio-option",
  },
  {
    value: PrivacyLevelEnum.Unlisted,
    label: "Unlisted",
    className: "radio-option",
  },
]

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
      <StyledFormDialog
        {...NiceModal.muiDialogV5(modal)}
        title={title}
        fullWidth
        formClassName="manage-list-form"
        onReset={formik.resetForm}
        onSubmit={formik.handleSubmit}
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
          className="form-row"
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
          className="form-row"
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
          className="form-row"
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
        />
        <BooleanRadioChoiceField
          className="form-row"
          name="published"
          label="Privacy"
          choices={LEARNING_PATH_PRIVACY_CHOICES}
          value={formik.values.published}
          row
          onChange={(e) => formik.setFieldValue(e.name, e.value)}
        />
      </StyledFormDialog>
    )
  },
)

interface UpsertUserListDialogProps {
  title: string
  userList?: UserList | null
}

const UpsertUserListDialog = NiceModal.create(
  ({ userList, title }: UpsertUserListDialogProps) => {
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
      <StyledFormDialog
        {...NiceModal.muiDialogV5(modal)}
        title={title}
        fullWidth
        formClassName="manage-list-form"
        onReset={formik.resetForm}
        onSubmit={formik.handleSubmit}
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
          className="form-row"
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
          className="form-row"
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
        <RadioChoiceField
          className="form-row"
          name="privacy_level"
          label="Privacy"
          choices={USER_LIST_PRIVACY_CHOICES}
          value={formik.values.privacy_level}
          row
          onChange={(e) => formik.setFieldValue(e.target.name, e.target.value)}
        />
      </StyledFormDialog>
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
      <BasicDialog
        {...NiceModal.muiDialogV5(modal)}
        onConfirm={handleConfirm}
        title="Delete Learning Path"
        confirmText="Yes, delete"
      >
        Are you sure you want to delete this list?
      </BasicDialog>
    )
  },
)

type DeleteUserListDialogProps = {
  userList: UserList
}

const DeleteUserListDialog = NiceModal.create(
  ({ userList }: DeleteUserListDialogProps) => {
    const modal = NiceModal.useModal()
    const hideModal = modal.hide
    const destroyList = useUserListDestroy()

    const handleConfirm = useCallback(async () => {
      await destroyList.mutateAsync({
        id: userList.id,
      })
      hideModal()
    }, [destroyList, hideModal, userList])
    return (
      <BasicDialog
        {...NiceModal.muiDialogV5(modal)}
        onConfirm={handleConfirm}
        title="Delete User List"
        confirmText="Yes, delete"
      >
        Are you sure you want to delete this list?
      </BasicDialog>
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
  upsertUserList: (userList?: UserList) => {
    const title = userList ? "Edit User List" : "Create User List"
    NiceModal.show(UpsertUserListDialog, { title, userList })
  },
  destroyUserList: (userList: UserList) =>
    NiceModal.show(DeleteUserListDialog, { userList }),
}

export { manageListDialogs }
