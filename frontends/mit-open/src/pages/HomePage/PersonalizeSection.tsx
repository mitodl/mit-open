import React from "react"
import { Typography, styled, Container, ButtonLink } from "ol-components"
import { useUserMe } from "api/hooks/user"
import * as urls from "@/common/urls"

const FullWidthBackground = styled.div(({ theme }) => ({
  padding: "80px 0",
  background:
    'url("/static/images/homepage/personalize-bg.png") center top no-repeat',
  backgroundSize: "cover",
  [theme.breakpoints.down("md")]: {
    padding: "40px 0",
  },
}))

const PersonalizeContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "80px",
  [theme.breakpoints.down("sm")]: {
    gap: "28px",
    flexDirection: "column",
  },
}))

const ImageContainer = styled.img(({ theme }) => ({
  display: "flex",
  flex: 1,
  alignItems: "end",
  minWidth: "0px",
  [theme.breakpoints.down("sm")]: {
    maxWidth: "100%",
  },
}))

const ControlsContainer = styled.section(({ theme }) => ({
  maxWidth: "442px",
  flex: 1,
  color: theme.custom.colors.white,
  display: "flex",
  alignItems: "start",
  flexDirection: "column",
  gap: "32px",
}))
const TextContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
})

const PersonalizeContent: React.FC = () => {
  const { data: user, isLoading } = useUserMe()

  if (isLoading) {
    return null
  }
  const authenticated = user?.is_authenticated

  const title = authenticated
    ? "Welcome Back to Your Learning Journey"
    : "Personalize Your Journey"
  const text = authenticated
    ? "We can help find the courses for you. Update your profile to get the best recommendations for you."
    : "We can help find the course for you. Tell us more about yourself to help you get started."
  const linkText = authenticated
    ? "Update your profile for new recommendations"
    : "Sign Up to Get Started"
  const href = authenticated ? urls.DASHBOARD : urls.login()
  return (
    <ControlsContainer>
      <TextContainer>
        <Typography component="h2" typography={{ xs: "h3", md: "h2" }}>
          {title}
        </Typography>
        <Typography typography={{ xs: "body2", md: "body1" }}>
          {text}
        </Typography>
      </TextContainer>
      <ButtonLink size="large" href={href} responsive>
        {linkText}
      </ButtonLink>
    </ControlsContainer>
  )
}

const PersonalizeSection = () => {
  return (
    <FullWidthBackground>
      <PersonalizeContainer>
        <ImageContainer
          src="/static/images/homepage/personalize-image.png"
          alt=""
        />
        <PersonalizeContent />
      </PersonalizeContainer>
    </FullWidthBackground>
  )
}

export default PersonalizeSection
