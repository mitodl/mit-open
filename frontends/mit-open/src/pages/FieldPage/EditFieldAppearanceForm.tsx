import React, { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useFormik } from "formik"
import { RadioChoiceField, Button, TextField } from "ol-components"
import * as Yup from "yup"

import { ChannelTypeEnum, FieldChannel } from "api/v0"
import { makeFieldViewPath } from "@/common/urls"
import { useChannelPartialUpdate } from "api/hooks/fields"

type FormProps = {
  field: FieldChannel
}
const CHANNEL_TYPE_CHOICES = [
  {
    value: "department",
    label: "Department",
    className: "radio-option",
  },
  {
    value: "topic",
    label: "Topic",
    className: "radio-option",
  },
  {
    value: "offeror",
    label: "Offeror",
    className: "radio-option",
  },
  {
    value: "pathway",
    label: "Pathway",
    className: "radio-option",
  },
]
const postSchema = Yup.object().shape({
  title: Yup.string().default("").required("Title is required."),
  public_description: Yup.string()
    .default("")
    .required("Description is required."),
  channel_type: Yup.string()
    .oneOf(Object.values(ChannelTypeEnum))
    .default("pathway")
    .required("Channel Type is required."),
})
type FormData = Yup.InferType<typeof postSchema>

const EditFieldAppearanceForm = (props: FormProps): JSX.Element => {
  const { field } = props
  const fieldId = field.id
  const editField = useChannelPartialUpdate()
  const navigate = useNavigate()

  const handleSubmit = useCallback(
    async (e: FormData) => {
      const data = await editField.mutateAsync({ id: fieldId, ...e })
      if (data) {
        navigate(makeFieldViewPath(data.channel_type, data.name))
      }
      return data
    },
    [navigate, fieldId, editField],
  )

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: field.title,
      public_description: String(field.public_description),
      channel_type: field.channel_type,
    },
    validationSchema: postSchema,
    onSubmit: handleSubmit,
  })

  return (
    <form onSubmit={formik.handleSubmit}>
      <TextField
        className="form-row"
        name="title"
        label="Title"
        placeholder="List Title"
        value={formik.values.title}
        error={!!formik.errors.title}
        errorText={formik.errors.title}
        onChange={formik.handleChange}
        fullWidth
      />
      <TextField
        className="form-row"
        label="Description"
        name="public_description"
        placeholder="List Description"
        value={formik.values.public_description}
        error={!!formik.errors.public_description}
        errorText={formik.errors.public_description}
        onChange={formik.handleChange}
        fullWidth
        multiline
      />
      <RadioChoiceField
        className="form-row"
        name="channel_type"
        label="Channel Type"
        choices={CHANNEL_TYPE_CHOICES}
        value={formik.values.channel_type}
        row
        onChange={(e) => formik.setFieldValue(e.target.name, e.target.value)}
      />
      <div className="form-row actions">
        <Button
          className="cancel"
          onClick={() =>
            navigate(makeFieldViewPath(field.channel_type, field.name))
          }
        >
          Cancel
        </Button>
        <Button type="submit" className="save-changes">
          Save
        </Button>
      </div>
    </form>
  )
}

export default EditFieldAppearanceForm
