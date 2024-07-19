import React, { useId, useMemo } from "react"
import { useFormik } from "formik"
import { Profile, useProfileMeMutation } from "api/hooks/profile"
import {
  styled,
  Button,
  CircularProgress,
  RadioChoiceField,
} from "ol-components"

import {
  ProfileSchema,
  NOTIFICATION_PREFERENCE_CHOICES,
} from "@/common/profile"

type Props = {
  profile: Profile
}

const FormContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  paddingTop: "40px",
  gap: "40px",
  [theme.breakpoints.down("md")]: {
    paddingTop: "24px",
    gap: "32px",
  },
}))

const RadioChoiceFieldStyled = styled(RadioChoiceField)(({ theme }) => ({
  label: {
    color: theme.custom.colors.darkGray2,
    ...theme.typography.subtitle2,
  },
}))

const ButtonContainer = styled.div(({ theme }) => ({
  paddingTop: "18px",
  [theme.breakpoints.down("md")]: {
    paddingTop: "0",
    paddingBottom: "34px",
  },
}))

const UpdateButton = styled(Button)(({ theme }) => ({
  width: "250px",
  [theme.breakpoints.down("md")]: {
    width: "100%",
  },
}))

const NotificationPreferenceForm: React.FC<Props> = ({ profile }) => {
  const formId = useId()
  const initialFormData = useMemo(() => {
    return {
      ...profile,
      topic_interests:
        profile?.topic_interests?.map((topic) => String(topic.id)) || [],
    }
  }, [profile])

  const { isLoading: isSaving, mutateAsync } = useProfileMeMutation()

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialFormData ?? ProfileSchema.getDefault(),
    validationSchema: ProfileSchema,
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
      <FormContainer>
        <RadioChoiceFieldStyled
          name="notification_preference"
          choices={NOTIFICATION_PREFERENCE_CHOICES}
          label={"How often do you want to receive emails?"}
          value={formik.values.notification_preference}
          onChange={formik.handleChange}
        />
        <ButtonContainer>
          <UpdateButton
            type="submit"
            size="large"
            variant="primary"
            endIcon={isSaving ? <CircularProgress /> : null}
            disabled={!formik.dirty || isSaving}
            form={formId}
          >
            Update
          </UpdateButton>
        </ButtonContainer>
      </FormContainer>
    </form>
  )
}

export { NotificationPreferenceForm }
