import React from "react"
import isEqual from "lodash/isEqual"
import { Profile, useProfileMeMutation } from "api/hooks/profile"
import type { PatchedProfileRequest } from "api/v0"
import {
  styled,
  Typography,
  Grid,
  Button,
  CircularProgress,
} from "ol-components"

import { LearningFormatSelect } from "@/page-components/Profile/LearningFormatChoice"
import { GoalsCheckboxChoiceField } from "@/page-components/Profile/GoalsChoice"
import { TopicInterestsChoiceBoxField } from "@/page-components/Profile/TopicInterestsChoice"
import { TimeCommitmentSelect } from "@/page-components/Profile/TimeCommitmentChoice"
import { EducationLevelSelect } from "@/page-components/Profile/EducationLevelChoice"
import { CertificateRadioChoiceField } from "@/page-components/Profile/CertificateChoice"

import type { ProfileFieldUpdateFunc } from "@/page-components/Profile/types"

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

const ProfileEditForm: React.FC<Props> = ({ profile }) => {
  const [updates, setUpdates] = React.useState<PatchedProfileRequest>({
    learning_format: profile.learning_format,
    time_commitment: profile.time_commitment,
    goals: profile.goals,
    topic_interests: profile.topic_interests?.map((topic) => topic.id) || [],
    certificate_desired: profile.certificate_desired,
    current_education: profile.current_education,
  })
  const { isLoading: isSaving, mutateAsync } = useProfileMeMutation()
  const [hasChanges, setHasChanges] = React.useState<boolean>(false)

  const handleUpdate: ProfileFieldUpdateFunc = <
    T extends keyof PatchedProfileRequest,
  >(
    name: T,
    value: PatchedProfileRequest[T],
  ) => {
    if (!isEqual(updates[name], value)) {
      setUpdates((prevUpdates) => ({
        ...prevUpdates,
        [name]: value,
      }))
      setHasChanges(true)
    }
  }

  const handleSave = () => {
    mutateAsync(updates).then(() => {
      setHasChanges(false)
    })
  }

  return (
    <>
      <TopicInterestsChoiceBoxField
        label={
          <FieldLabel>What are you interested in learning about?</FieldLabel>
        }
        value={profile.topic_interests}
        onUpdate={handleUpdate}
        gridProps={{
          columns: {
            xl: 12,
            lg: 9,
            md: 6,
            xs: 3,
          },
        }}
      />
      <GoalsCheckboxChoiceField
        label={<FieldLabel>What do you want to reach?</FieldLabel>}
        value={profile.goals}
        onUpdate={handleUpdate}
      />
      <CertificateRadioChoiceField
        label={<FieldLabel>Are you seeking a certificate?</FieldLabel>}
        value={profile.certificate_desired}
        onUpdate={handleUpdate}
      />
      <Grid container columns={{ lg: 12, xs: 6 }} columnSpacing={2}>
        <Grid item xs={6}>
          <EducationLevelSelect
            label={
              <FieldLabel>What is your current level of education?</FieldLabel>
            }
            value={profile.current_education}
            onUpdate={handleUpdate}
          />
        </Grid>
        <Grid item xs={6} />
        <Grid item xs={6}>
          <TimeCommitmentSelect
            label={
              <FieldLabel>
                How much time per week do you want to commit to learning?
              </FieldLabel>
            }
            value={profile.time_commitment}
            onUpdate={handleUpdate}
          />
        </Grid>
        <Grid item xs={6}>
          <LearningFormatSelect
            label={<FieldLabel>What format are you interested in?</FieldLabel>}
            value={profile.learning_format}
            onUpdate={handleUpdate}
          />
        </Grid>
      </Grid>
      <ButtonContainer>
        <Button
          endIcon={isSaving ? <CircularProgress /> : null}
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
        >
          Update
        </Button>
      </ButtonContainer>
    </>
  )
}

export { ProfileEditForm }
