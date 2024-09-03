'use client'

import React, { useId, useMemo } from "react"
import { useRouter } from "next/navigation";
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
  CheckboxChoiceBoxField,
  RadioChoiceBoxField,
  SimpleSelectField,
  Skeleton,
} from "ol-components"

import { RiArrowRightLine, RiArrowLeftLine } from "@remixicon/react"
import { useProfileMeMutation, useProfileMeQuery } from "api/hooks/profile"
import { DASHBOARD_HOME } from "@/common/urls"

import { useFormik } from "formik"
import { useLearningResourceTopics } from "api/hooks/learningResources"
import { useUserMe } from "api/hooks/user"
import {
  CERTIFICATE_CHOICES,
  EDUCATION_LEVEL_OPTIONS,
  GOALS_CHOICES,
  LEARNING_FORMAT_CHOICES,
  ProfileSchema,
} from "@/common/profile"
// import MetaTags from "@/page-components/MetaTags/MetaTags"

const NUM_STEPS = 5

const FlexContainer = styled(Container)({
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  maxWidth: "800px",
})

const Form = styled.form({
  width: "100%",
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
  "& > div:first-of-type": {
    flex: 1,
  },
  // this makes <StepNumbers> take up all the right space
  "& > div:last-of-type": {
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
        ? theme.custom.colors.red
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
  paddingTop: "16px",
})) as typeof Typography

const Label = styled.div({
  textAlign: "center",
  margin: "0 0 40px",
})

const GridStyle = (
  justifyContent = "center",
  columns = {
    lg: 12,
    md: 9,
    xs: 3,
  },
  maxWidth = "lg",
) => {
  return {
    gridProps: {
      justifyContent: justifyContent,
      columns: columns,
      maxWidth: maxWidth,
    },
    gridItemProps: { xs: 3 },
  }
}

const OnboardingPage: React.FC = () => {
  const { data: profile, isLoading: isLoadingProfile } = useProfileMeQuery()
  const formId = useId()
  const initialFormData = useMemo(() => {
    return {
      ...profile,
      topic_interests:
        profile?.topic_interests?.map((topic) => String(topic.id)) || [],
    }
  }, [profile])
  const { isLoading: isSaving, mutateAsync } = useProfileMeMutation()
  const { isLoading: userLoading, data: user } = useUserMe()
  const [activeStep, setActiveStep] = React.useState<number>(0)
  const router = useRouter()

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
      if (activeStep < NUM_STEPS - 1) {
        setActiveStep((prevActiveStep) => prevActiveStep + 1)
      } else {
        router.push(DASHBOARD_HOME)
      }
    },
    validateOnChange: false,
    validateOnBlur: false,
  })

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const { data: topics } = useLearningResourceTopics({ is_toplevel: true })
  const topicChoices =
    topics?.results?.map((topic) => ({
      label: topic.name,
      value: topic.id.toString(),
    })) ?? []

  if (!profile) {
    return null
  }

  const pages = [
    <Container key="topic_interests" maxWidth="lg">
      <CheckboxChoiceBoxField
        name="topic_interests"
        choices={topicChoices}
        {...GridStyle("left")}
        label={
          <Label>
            {userLoading ? (
              <Skeleton variant="text" width="100%" height={40} />
            ) : (
              <Title variant="h4">
                Welcome{user?.first_name ? `, ${user.first_name}` : ""}! What
                are you interested in learning about?
              </Title>
            )}
            <Prompt component="p">Select all that apply:</Prompt>
          </Label>
        }
        values={formik.values.topic_interests}
        onChange={formik.handleChange}
      />
    </Container>,
    <Container key="goals" maxWidth="lg">
      <CheckboxChoiceBoxField
        name="goals"
        choices={GOALS_CHOICES}
        {...GridStyle()}
        label={
          <Label>
            <Title component="h3" variant="h6">
              What are your learning goals?
            </Title>
            <Prompt component="p">Select all that apply:</Prompt>
          </Label>
        }
        values={formik.values.goals}
        onChange={(event) => {
          console.log(event)
          formik.handleChange(event)
        }}
      />
    </Container>,
    <Container key="certificate_desired" maxWidth="lg">
      <RadioChoiceBoxField
        name="certificate_desired"
        choices={CERTIFICATE_CHOICES}
        {...GridStyle()}
        label={
          <Label>
            <Title component="h3" variant="h6">
              Are you seeking a certificate?
            </Title>
          </Label>
        }
        value={formik.values.certificate_desired}
        onChange={formik.handleChange}
      />
    </Container>,
    <Container key="current_education" maxWidth="sm">
      <SimpleSelectField
        options={EDUCATION_LEVEL_OPTIONS}
        name="current_education"
        fullWidth
        label={
          <Label>
            <Title component="h3" variant="h6">
              What is your current level of education?
            </Title>
          </Label>
        }
        value={formik.values.current_education}
        onChange={formik.handleChange}
      />
    </Container>,
    <Container key="learning_format" maxWidth="md">
      <CheckboxChoiceBoxField
        name="learning_format"
        choices={LEARNING_FORMAT_CHOICES}
        {...GridStyle()}
        label={
          <Label>
            <Title component="h3" variant="h6">
              What course format are you interested in?
            </Title>
            <Prompt>Select all that apply:</Prompt>
          </Label>
        }
        values={formik.values.learning_format}
        onChange={formik.handleChange}
      />
    </Container>,
  ]

  return activeStep < NUM_STEPS ? (
    <FlexContainer>
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
        <Form id={formId} onSubmit={formik.handleSubmit}>
          {pages[activeStep]}
        </Form>
      )}
      <NavControls>
        {activeStep > 0 ? (
          <Button
            variant="secondary"
            size="large"
            responsive={true}
            startIcon={<RiArrowLeftLine />}
            onClick={handleBack}
            disabled={isSaving}
          >
            Back
          </Button>
        ) : null}
        {
          <Button
            size="large"
            responsive={true}
            endIcon={
              activeStep < NUM_STEPS - 1 ? (
                isSaving ? (
                  <CircularProgress />
                ) : (
                  <RiArrowRightLine />
                )
              ) : null
            }
            disabled={isSaving}
            type="submit"
            form={formId}
          >
            {activeStep < NUM_STEPS - 1 ? "Next" : "Finish"}
          </Button>
        }
      </NavControls>
    </FlexContainer>
  ) : null
}

export default OnboardingPage
