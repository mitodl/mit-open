import React, { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useFormik } from "formik"
import { Button, TextField } from "ol-components"
import * as Yup from "yup"

import type { FieldChannel } from "api/v0"
import { makeFieldViewPath } from "@/common/urls"
import { useFieldPartialUpdate } from "api/hooks/fields"

type FormProps = {
  field: FieldChannel
}

const postSchema = Yup.object().shape({
  title: Yup.string().default("").required("Title is required."),
  public_description: Yup.string()
    .default("")
    .required("Description is required."),
})
type FormData = Yup.InferType<typeof postSchema>

const EditFieldAppearanceForm = (props: FormProps): JSX.Element => {
  const { field } = props
  const fieldName = field.name
  const editField = useFieldPartialUpdate()
  const navigate = useNavigate()

  const handleSubmit = useCallback(
    async (e: FormData) => {
      const data = await editField.mutateAsync({ field_name: fieldName, ...e })
      if (data) {
        navigate(makeFieldViewPath(data.name))
      }
      return data
    },
    [navigate, fieldName, editField],
  )

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: field.title,
      public_description: field.public_description,
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
        helperText={formik.errors.title}
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
        helperText={formik.errors.public_description}
        onChange={formik.handleChange}
        fullWidth
        multiline
      />

      <div className="form-row actions">
        <Button
          className="cancel"
          onClick={() => navigate(makeFieldViewPath(field.name))}
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
