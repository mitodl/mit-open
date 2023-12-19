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
} from "ol-components"
import * as Yup from "yup"
import type { LearningPathResource } from "api"

import {
  useLearningpathCreate,
  useLearningpathUpdate,
  useLearningpathDestroy,
  useLearningResourceTopics,
} from "api/hooks/learningResources"

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
      }),
    )
    .min(1, "Select between 1 and 3 subjects.")
    .max(3, "Select between 1 and 3 subjects.")
    .default([])
    .nonNullable()
    .required(),
})

const PRIVACY_CHOICES = [
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

type FormValues = Yup.InferType<typeof learningPathFormSchema>

const variantProps = { InputLabelProps: { shrink: true } }

interface UpsertListDialogProps {
  title: string
  resource?: LearningPathResource | null
}

const UpsertListDialog = NiceModal.create(
  ({ resource, title }: UpsertListDialogProps) => {
    const modal = NiceModal.useModal()
    const topicsQuery = useLearningResourceTopics(undefined, {
      enabled: modal.visible,
    })
    const createList = useLearningpathCreate()
    const updateList = useLearningpathUpdate()
    const mutation = resource?.id ? updateList : createList
    const handleSubmit: FormikConfig<
      LearningPathResource | FormValues
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
        resource ?? (learningPathFormSchema.getDefault() as FormValues),
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
          helperText={formik.errors.title}
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
          helperText={formik.errors.description}
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
          renderInput={(params) => (
            <TextField
              {...params}
              {...variantProps}
              required
              error={!!formik.errors.topics}
              helperText={formik.errors.topics as string | undefined}
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
          choices={PRIVACY_CHOICES}
          value={formik.values.published}
          row
          onChange={(e) => formik.setFieldValue(e.name, e.value)}
        />
      </FormDialog>
    )
  },
)

type DeleteListDialogProps = {
  resource: LearningPathResource
}

const DeleteListDialog = NiceModal.create(
  ({ resource }: DeleteListDialogProps) => {
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

const manageListDialogs = {
  upsert: (resource?: LearningPathResource) => {
    const title = resource ? "Edit Learning Path" : "Create Learning Path"
    NiceModal.show(UpsertListDialog, { title, resource })
  },
  destroy: (resource: LearningPathResource) =>
    NiceModal.show(DeleteListDialog, { resource }),
}

export { manageListDialogs }
