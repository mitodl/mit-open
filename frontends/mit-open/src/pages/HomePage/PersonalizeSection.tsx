import React from "react"
import { Typography, styled, Container, ButtonLink } from "ol-components"
import { useUserMe } from "api/hooks/user"

const FullWidthBackground = styled.div(({ theme }) => ({
  padding: "80px 0",
  background: 'url("/static/images/homepage/personalize-bg.png")',
  [theme.breakpoints.down("sm")]: {
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

const ControlsContainer = styled.div(({ theme }) => ({
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

const DesktopLink = styled(ButtonLink)(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}))
const MobileLink = styled(ButtonLink)(({ theme }) => ({
  [theme.breakpoints.up("md")]: {
    display: "none",
  },
}))

const PersonalizeContent: React.FC = () => {
  const { data: user } = useUserMe()
  const title = user
    ? "Welcome Back to Your Learning Journey"
    : "Personalize Your Journey"
  const text = user
    ? "We can help find the courses for you. Update your profile to get the best recommendations for you."
    : "We can help find the course for you. Tell us more about yourself to help you get started."
  const linkText = user
    ? "Update your profile for new recommendations"
    : "Sign Up to Get Started"
  const href = user ? "/profile" : "/onboarding"
  return (
    <ControlsContainer>
      <TextContainer>
        <Typography typography={{ xs: "h3", md: "h2" }}>{title}</Typography>
        <Typography typography={{ xs: "body2", md: "body1" }}>
          {text}
        </Typography>
      </TextContainer>
      <DesktopLink size="large" href={href}>
        {linkText}
      </DesktopLink>
      <MobileLink size="medium" href={href}>
        {linkText}
      </MobileLink>
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
