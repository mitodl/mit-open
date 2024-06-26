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
  [theme.breakpoints.down("md")]: {
    gap: "40px",
  },
  [theme.breakpoints.down("sm")]: {
    gap: "28px",
    flexDirection: "column",
  },
}))

const ImageContainer = styled.img(({ theme }) => ({
  display: "flex",
  alignItems: "end",
  minWidth: "0px",
  maxWidth: "646px",
  [theme.breakpoints.up("sm")]: {
    /**
     * Flex 1, combined with the maxWidth, was causing the image to be stretched
     * on Safari. We don't need flex 1 on the mobile layout, so omit it there.
     */
    flex: 1,
  },
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

const AUTH_TEXT_DATA = {
  authenticated: {
    title: "Personalize Your Journey",
    text: "Find your next course. Check your dashboard for personalized recommendations.",
    linkProps: {
      children: "Dashboard",
      href: urls.DASHBOARD,
    },
  },
  anonymous: {
    title: "Personalize Your Journey",
    text: "We can help find the courses for you. Tell us more about yourself to help you get started.",
    linkProps: {
      children: "Sign Up to Get Started",
      reloadDocument: true,
      href: urls.login({
        pathname: urls.DASHBOARD,
      }),
    },
  },
}

const PersonalizeContent: React.FC = () => {
  const { data: user, isLoading } = useUserMe()

  if (isLoading) {
    return <ControlsContainer />
  }
  const authenticated = user?.is_authenticated
  const key = authenticated ? "authenticated" : "anonymous"
  const { title, text, linkProps } = AUTH_TEXT_DATA[key]
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
      <ButtonLink size="large" responsive {...linkProps} />
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
