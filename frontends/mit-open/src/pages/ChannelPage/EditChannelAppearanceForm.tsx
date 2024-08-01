import React, { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useFormik } from "formik"
import { RadioChoiceField, Button, TextField } from "ol-components"
import * as Yup from "yup"

import { ChannelTypeEnum, Channel } from "api/v0"
import { makeChannelViewPath } from "@/common/urls"
import { useChannelPartialUpdate } from "api/hooks/channels"

type FormProps = {
  channel: Channel
}
const CHANNEL_TYPE_CHOICES = [
  {
    value: "department",
    label: "Department",
  },
  {
    value: "topic",
    label: "Topic",
  },
  {
    value: "unit",
    label: "Unit",
  },
  {
    value: "pathway",
    label: "Pathway",
  },
]
const postSchema = Yup.object().shape({
  title: Yup.string().default("").required("Title is required"),
  public_description: Yup.string()
    .default("")
    .required("Description is required"),
  channel_type: Yup.string()
    .oneOf(Object.values(ChannelTypeEnum))
    .default("pathway")
    .required("Channel Type is required"),
})
type FormData = Yup.InferType<typeof postSchema>

const EditChannelAppearanceForm = (props: FormProps): JSX.Element => {
  const { channel } = props
  const channelId = channel.id
  const editChannel = useChannelPartialUpdate()
  const navigate = useNavigate()

  const handleSubmit = useCallback(
    async (e: FormData) => {
      const data = await editChannel.mutateAsync({ id: channelId, ...e })
      if (data) {
        navigate(makeChannelViewPath(data.channel_type, data.name))
      }
      return data
    },
    [navigate, channelId, editChannel],
  )

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: channel.title,
      public_description: String(channel.public_description),
      channel_type: channel.channel_type,
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
        onChange={(e) => formik.setFieldValue(e.target.name, e.target.value)}
      />
      <div className="form-row actions">
        <Button
          className="cancel"
          onClick={() =>
            navigate(makeChannelViewPath(channel.channel_type, channel.name))
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

export default EditChannelAppearanceForm
