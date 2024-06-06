import React from "react"
import { useNavigate } from "react-router-dom"
import isEmpty from "lodash/isEmpty"
import isMatch from "lodash/isMatch"
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
} from "ol-components"
import { MetaTags } from "ol-utilities"
import { RiArrowRightLine, RiArrowLeftLine } from "@remixicon/react"
import { PatchedProfileRequest } from "api/v0"

import LearningFormatStep from "./LearningFormatStep"
import GoalsStep from "./GoalsStep"
import TopicInterestsStep from "./TopicInterestsStep"
import TimeCommitmentStep from "./TimeCommitmentStep"
import EducationLevelStep from "./EducationLevelStep"
import CertificateStep from "./CertificateStep"
import { useProfileMeMutation, useProfileMeQuery } from "api/hooks/profile"
import { DASHBOARD } from "../../common/urls"

import type { StepProps, StepUpdateFunc } from "./types"

const StepNames = {
  TopicInterests: "topic_interests",
  Goals: "goals",
  Certificate: "certificate",
  EducationLevel: "education_level",
  TimeCommitment: "time_commitment",
  LearningFormat: "course_format",
}

const STEPS = [
  StepNames.TopicInterests,
  StepNames.Goals,
  StepNames.Certificate,
  StepNames.EducationLevel,
  StepNames.TimeCommitment,
  StepNames.LearningFormat,
]

const STEP_COMPONENTS: Record<string, React.ComponentType<StepProps>> = {
  [StepNames.TopicInterests]: TopicInterestsStep,
  [StepNames.Goals]: GoalsStep,
  [StepNames.Certificate]: CertificateStep,
  [StepNames.EducationLevel]: EducationLevelStep,
  [StepNames.TimeCommitment]: TimeCommitmentStep,
  [StepNames.LearningFormat]: LearningFormatStep,
}

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
  // the two following rules work in concert to cetner the <Stepper>
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

const OnboardingPage: React.FC = () => {
  const [updates, setUpdates] = React.useState<PatchedProfileRequest>({})
  const profile = useProfileMeQuery()
  const profileMutation = useProfileMeMutation()
  const [activeStep, setActiveStep] = React.useState<number>(0)
  const [isStepValid, setisStepValid] = React.useState(false)
  const navigate = useNavigate()

  const handleNext = () => {
    // TODO: handle this error
    profileMutation.mutateAsync(updates).then(() => {
      setActiveStep((prevActiveStep) => prevActiveStep + 1)
    })
  }
  const handleFinish = () => {
    profileMutation.mutateAsync(updates).then(() => {
      navigate(DASHBOARD)
    })
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleUpdate: StepUpdateFunc = (newUpdates) => {
    if (!isMatch(updates, newUpdates)) {
      setUpdates(updates)
      setisStepValid(
        Object.values(newUpdates).every((value) => !isEmpty(value)),
      )
    }
  }

  const StepComponent = STEP_COMPONENTS[STEPS[activeStep]]

  return activeStep < STEPS.length ? (
    <FlexContainer>
      <MetaTags>
        <title>Onboarding</title>
      </MetaTags>
      <StepContainer>
        <div />
        <Stepper connector={null}>
          {STEPS.map((name, index) => (
            <Step
              key={name}
              completed={activeStep > index}
              active={activeStep === index}
            >
              <StepLabel StepIconComponent={StepIcon} />
            </Step>
          ))}
        </Stepper>
        <StepNumbers>
          <span className="current-step">{activeStep + 1}</span>/{STEPS.length}
        </StepNumbers>
      </StepContainer>
      {profile.isLoading ? <LoadingSpinner loading={true} /> : null}
      {profile.isSuccess ? (
        <StepComponent profile={profile.data} onUpdate={handleUpdate} />
      ) : null}
      <NavControls>
        {activeStep > 0 ? (
          <Button
            variant="secondary"
            startIcon={<RiArrowLeftLine />}
            onClick={handleBack}
            disabled={profileMutation.isLoading}
          >
            Back
          </Button>
        ) : null}
        {activeStep < STEPS.length - 1 ? (
          <Button
            endIcon={
              profileMutation.isLoading ? (
                <CircularProgress />
              ) : (
                <RiArrowRightLine />
              )
            }
            onClick={handleNext}
            disabled={!isStepValid || profileMutation.isLoading}
          >
            Next
          </Button>
        ) : (
          <Button
            endIcon={
              profileMutation.isLoading ? (
                <CircularProgress />
              ) : (
                <RiArrowRightLine />
              )
            }
            onClick={handleFinish}
            disabled={!isStepValid || profileMutation.isLoading}
          >
            Finish
          </Button>
        )}
      </NavControls>
    </FlexContainer>
  ) : null
}

export default OnboardingPage
