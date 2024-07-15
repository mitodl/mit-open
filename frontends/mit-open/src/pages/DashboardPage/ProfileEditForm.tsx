import React, { useId, useMemo } from "react"
import { useFormik } from "formik"
import * as yup from "yup"
import { Profile, useProfileMeMutation } from "api/hooks/profile"
import {
  styled,
  Typography,
  Grid,
  Button,
  CircularProgress,
  CheckboxChoiceBoxField,
  CheckboxChoiceField,
  RadioChoiceField,
  SimpleSelectField,
} from "ol-components"

import { useLearningResourceTopics } from "api/hooks/learningResources"
import {
  CERTIFICATE_CHOICES,
  EDUCATION_LEVEL_OPTIONS,
  GOALS_CHOICES,
  LEARNING_FORMAT_CHOICES,
} from "@/page-components/Profile/constants"

type Props = {
  profile: Profile
}

const FieldLabel = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  ...theme.typography.body1,
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(1),
  [theme.breakpoints.down("md")]: {
    ...theme.typography.subtitle3,
  },
}))

const ButtonContainer = styled.div(({ theme }) => ({
  marginTop: theme.spacing(3),
}))

const UpdateButton = styled(Button)({
  width: "200px",
})

const ProfileEditForm: React.FC<Props> = ({ profile }) => {
  const formId = useId()
  const initialFormData = useMemo(() => {
    return {
      ...profile,
      topic_interests:
        profile?.topic_interests?.map((topic) => String(topic.id)) || [],
    }
  }, [profile])
  const { isLoading: isSaving, mutateAsync } = useProfileMeMutation()
  const profileSchema = yup.object().shape({
    topic_interests: yup.array().of(yup.string()),
    goals: yup
      .array()
      .of(yup.string().oneOf(GOALS_CHOICES.map((choice) => choice.value))),
    certificate_desired: yup.string(),
    current_education: yup.string(),
    learning_format: yup.array().of(yup.string()),
  })
  const { data: topics } = useLearningResourceTopics({ is_toplevel: true })
  const topicChoices =
    topics?.results?.map((topic) => ({
      label: topic.name,
      value: topic.id.toString(),
    })) ?? []
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialFormData ?? profileSchema.getDefault(),
    validationSchema: profileSchema,
    onSubmit: async (values) => {
      if (formik.dirty) {
        await mutateAsync({
          ...values,
          topic_interests: values.topic_interests.map((id) => parseInt(id)),
        })
      }
    },
    validateOnChange: false,
    validateOnBlur: false,
  })

  return (
    <form id={formId} onSubmit={formik.handleSubmit}>
      <CheckboxChoiceBoxField
        name="topic_interests"
        choices={topicChoices}
        label={
          <FieldLabel>What are you interested in learning about?</FieldLabel>
        }
        values={formik.values.topic_interests}
        onChange={formik.handleChange}
        gridProps={{
          justifyContent: "left",
          maxWidth: "lg",
          columns: {
            xl: 12,
            lg: 9,
            md: 6,
            xs: 3,
          },
        }}
        gridItemProps={{ xs: 3 }}
      />
      <CheckboxChoiceField
        name="goals"
        row={true}
        choices={GOALS_CHOICES}
        label={<FieldLabel>What do you want to reach?</FieldLabel>}
        values={formik.values.goals}
        onChange={formik.handleChange}
      />
      <RadioChoiceField
        name="certificate_desired"
        row={true}
        choices={CERTIFICATE_CHOICES}
        label={<FieldLabel>Are you seeking a certificate?</FieldLabel>}
        value={formik.values.certificate_desired}
        onChange={formik.handleChange}
      />
      <Grid container columns={{ lg: 12, xs: 6 }} columnSpacing={2}>
        <Grid item xs={6}>
          <SimpleSelectField
            options={EDUCATION_LEVEL_OPTIONS}
            name="current_education"
            fullWidth
            label={
              <FieldLabel>What is your current level of education?</FieldLabel>
            }
            value={formik.values.current_education}
            onChange={formik.handleChange}
          />
        </Grid>
        <Grid item xs={6} />
        <Grid item xs={6}>
          <CheckboxChoiceField
            name="learning_format"
            row={true}
            choices={LEARNING_FORMAT_CHOICES}
            label={<FieldLabel>What format are you interested in?</FieldLabel>}
            values={formik.values.learning_format}
            onChange={formik.handleChange}
          />
        </Grid>
      </Grid>
      <ButtonContainer>
        <UpdateButton
          type="submit"
          size="large"
          variant="primary"
          endIcon={isSaving ? <CircularProgress /> : null}
          disabled={!formik.dirty}
          form={formId}
        >
          Update
        </UpdateButton>
      </ButtonContainer>
    </form>
  )
}

export { ProfileEditForm }
