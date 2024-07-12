import React from "react"
import { useNavigate } from "react-router-dom"
import isEqual from "lodash/isEqual"
import range from "lodash/range"
import {
  styled,
  Step,
  Stepper,
  StepLabel,
  StepIconProps,
  Container,
  Button,
  LoadingSpinner,
  CircularProgress,
  Typography,
} from "ol-components"
import { MetaTags } from "ol-utilities"
import { RiArrowRightLine, RiArrowLeftLine } from "@remixicon/react"
import { PatchedProfileRequest } from "api/v0"

import { LearningFormatChoiceBoxField } from "@/page-components/Profile/LearningFormatChoice"
import { GoalsChoiceBoxField } from "@/page-components/Profile/GoalsChoice"
import { TopicInterestsChoiceBoxField } from "@/page-components/Profile/TopicInterestsChoice"
import { TimeCommitmentRadioChoiceBoxField } from "@/page-components/Profile/TimeCommitmentChoice"
import { EducationLevelSelect } from "@/page-components/Profile/EducationLevelChoice"
import { CertificateChoiceBoxField } from "@/page-components/Profile/CertificateChoice"
import { useProfileMeMutation, useProfileMeQuery } from "api/hooks/profile"
import { DASHBOARD } from "@/common/urls"

import type { ProfileFieldUpdateFunc } from "@/page-components/Profile/types"

const NUM_STEPS = 6

const FlexContainer = styled(Container)({
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  maxWidth: "800px",
})

const StepContainer = styled(Container)({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  margin: "0 auto",
  padding: "60px 0 30px",
  "& .MuiStep-root": {
    padding: 0,
  },
  // the two following rules work in concert to center the <Stepper>
  // this makes the empty div take up all the left space
  "& > div:first-child": {
    flex: 1,
  },
  // this makes <StepNumbers> take up all the right space
  "& > div:last-child": {
    flex: 1,
  },
})

const StepNumbers = styled.div(({ theme }) => ({
  color: theme.custom.colors.silverGrayDark,
  fontWeight: theme.typography.subtitle1.fontWeight,
  fontSize: "12px",
  lineHeight: "16px",
  "& .current-step": {
    color: theme.custom.colors.darkGray2,
  },
}))

const NavControls = styled.div({
  display: "flex",
  alignItems: "center",
  margin: "30px 0",
  "> *:not(:last-child)": {
    marginRight: "0.5rem",
  },
})

const StepPill = styled.div<{ ownerState: StepIconProps }>(
  ({ theme, ownerState }) => ({
    backgroundColor:
      ownerState.active || ownerState.completed
        ? theme.custom.colors.mitRed
        : theme.custom.colors.silverGrayLight,
    height: "8px",
    borderRadius: "4px",
    width: "64px",
    [theme.breakpoints.only("sm")]: {
      width: "48px",
    },
    [theme.breakpoints.only("xs")]: {
      width: "24px",
    },
  }),
)

function StepIcon(props: StepIconProps) {
  return <StepPill ownerState={props} />
}

const Title = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.black,
})) as typeof Typography

const Prompt = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.silverGrayDark,
})) as typeof Typography

const Label = styled.div({
  textAlign: "center",
  margin: "0 0 40px",
})

const OnboardingPage: React.FC = () => {
  const [updates, setUpdates] = React.useState<PatchedProfileRequest>({})
  const { data: profile, isLoading: isLoadingProfile } = useProfileMeQuery()
  const { isLoading: isSaving, mutateAsync } = useProfileMeMutation()
  const [activeStep, setActiveStep] = React.useState<number>(0)
  const navigate = useNavigate()

  const handleNext = () => {
    // TODO: handle this error
    mutateAsync(updates).then(() => {
      setActiveStep((prevActiveStep) => prevActiveStep + 1)
    })
  }
  const handleFinish = () => {
    mutateAsync(updates).then(() => {
      navigate(DASHBOARD)
    })
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleUpdate: ProfileFieldUpdateFunc = <
    T extends keyof PatchedProfileRequest,
  >(
    name: T,
    value: PatchedProfileRequest[T],
  ) => {
    if (!isEqual(updates[name], value)) {
      setUpdates({
        [name]: value,
      })
    }
  }
  if (typeof profile === "undefined") {
    return null
  }

  return activeStep < NUM_STEPS ? (
    <FlexContainer>
      <MetaTags title="Onboarding" />
      <StepContainer>
        <div />
        <Stepper connector={null}>
          {range(NUM_STEPS).map((index) => (
            <Step
              key={index}
              completed={activeStep > index}
              active={activeStep === index}
            >
              <StepLabel StepIconComponent={StepIcon} />
            </Step>
          ))}
        </Stepper>
        <StepNumbers>
          <span className="current-step">{activeStep + 1}</span>/{NUM_STEPS}
        </StepNumbers>
      </StepContainer>
      {isLoadingProfile ? (
        <LoadingSpinner loading={true} />
      ) : (
        <>
          {activeStep === 0 ? (
            <Container maxWidth="lg">
              <TopicInterestsChoiceBoxField
                label={
                  <Label>
                    <Title component="h3" variant="h6">
                      Welcome{profile.name ? `, ${profile.name}` : ""}! What are
                      you interested in learning about?
                    </Title>
                    <Prompt component="p">Select all that apply:</Prompt>
                  </Label>
                }
                value={profile.topic_interests}
                onUpdate={handleUpdate}
              />
            </Container>
          ) : null}
          {activeStep === 1 ? (
            <Container maxWidth="lg">
              <GoalsChoiceBoxField
                label={
                  <Label>
                    <Title component="h3" variant="h6">
                      What do you want MIT online education to help you reach?
                    </Title>
                    <Prompt component="p">Select all that apply:</Prompt>
                  </Label>
                }
                value={profile.goals}
                onUpdate={handleUpdate}
              />
            </Container>
          ) : null}
          {activeStep === 2 ? (
            <Container maxWidth="md">
              <CertificateChoiceBoxField
                label={
                  <Label>
                    <Title component="h3" variant="h6">
                      Are you seeking to receive a certificate?
                    </Title>
                    <Prompt>Select one:</Prompt>
                  </Label>
                }
                value={profile.certificate_desired}
                onUpdate={handleUpdate}
              />
            </Container>
          ) : null}
          {activeStep === 3 ? (
            <Container maxWidth="sm">
              <EducationLevelSelect
                label={
                  <Label>
                    <Title component="h3" variant="h6">
                      What is your current level of education?
                    </Title>
                  </Label>
                }
                value={profile.current_education}
                onUpdate={handleUpdate}
              />
            </Container>
          ) : null}
          {activeStep === 4 ? (
            <Container maxWidth="md">
              <TimeCommitmentRadioChoiceBoxField
                label={
                  <Label>
                    <Title component="h3" variant="h6">
                      How much time per week do you want to commit to learning?
                    </Title>
                    <Prompt>Select one:</Prompt>
                  </Label>
                }
                value={profile.time_commitment}
                onUpdate={handleUpdate}
              />
            </Container>
          ) : null}
          {activeStep === 5 ? (
            <Container maxWidth="md">
              <LearningFormatChoiceBoxField
                label={
                  <Label>
                    <Title component="h3" variant="h6">
                      What course format are you interested in?
                    </Title>
                    <Prompt>Select one:</Prompt>
                  </Label>
                }
                value={profile.learning_format}
                onUpdate={handleUpdate}
              />
            </Container>
          ) : null}
        </>
      )}
      <NavControls>
        {activeStep > 0 ? (
          <Button
            variant="secondary"
            startIcon={<RiArrowLeftLine />}
            onClick={handleBack}
            disabled={isSaving}
          >
            Back
          </Button>
        ) : null}
        {activeStep < NUM_STEPS - 1 ? (
          <Button
            endIcon={isSaving ? <CircularProgress /> : <RiArrowRightLine />}
            onClick={handleNext}
            disabled={isSaving}
          >
            Next
          </Button>
        ) : (
          <Button
            endIcon={isSaving ? <CircularProgress /> : <RiArrowRightLine />}
            onClick={handleFinish}
            disabled={isSaving}
          >
            Finish
          </Button>
        )}
      </NavControls>
    </FlexContainer>
  ) : null
}

export default OnboardingPage
