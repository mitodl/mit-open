import React from "react"
import styled from "@emotion/styled"
import Typography from "@mui/material/Typography"
import Container from "@mui/material/Container"
import { ResponsiveStyleValue, SxProps } from "@mui/system"
import { Theme } from "../ThemeProvider/ThemeProvider"

const DEFAULT_BACKGROUND_IMAGE_URL = "/static/images/background_steps.jpg"

const SubHeader = styled(Typography)({
  marginTop: "8px",
  marginBottom: "8px",
})

type BannerBackgroundProps = {
  backgroundUrl?: string
  backgroundSize?: string
  backgroundDim?: number
}

/**
 * This is a full-width banner component that takes a background image URL.
 */
const BannerBackground = styled.div<BannerBackgroundProps>(
  ({
    theme,
    backgroundUrl = DEFAULT_BACKGROUND_IMAGE_URL,
    backgroundSize = "cover",
    backgroundDim = 0,
  }) => ({
    backgroundAttachment: "fixed",
    backgroundImage: backgroundDim
      ? `linear-gradient(rgba(0 0 0 / ${backgroundDim}%), rgba(0 0 0 / ${backgroundDim}%)), url('${backgroundUrl}')`
      : `url(${backgroundUrl})`,
    backgroundSize: backgroundSize,
    backgroundPosition: "center top",
    backgroundRepeat: "no-repeat",
    color: theme.custom.colors.white,
    padding: "48px 0 48px 0",
    [theme.breakpoints.up("lg")]: {
      backgroundSize:
        backgroundUrl === DEFAULT_BACKGROUND_IMAGE_URL
          ? "140%"
          : backgroundSize,
    },
    [theme.breakpoints.down("sm")]: {
      padding: "32px 0 32px 0",
    },
  }),
)

const InnerContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}))

const HeaderContainer = styled.div({
  display: "flex",
  flexDirection: "column",
})

const ActionsContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}))

const ActionsContainerDesktop = styled(ActionsContainer)(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}))

const ActionsContainerMobile = styled.div(({ theme }) => ({
  paddingTop: "16px",
  paddingBottom: "8px",
  [theme.breakpoints.up("md")]: {
    display: "none",
  },
}))

type BannerProps = BannerBackgroundProps & {
  navText: React.ReactNode
  avatar?: React.ReactNode
  title?: React.ReactNode
  titleTypography?: ResponsiveStyleValue<string | undefined>
  titleStyles?: SxProps<Theme>
  header: React.ReactNode
  headerTypography?: ResponsiveStyleValue<string | undefined>
  headerStyles?: SxProps<Theme>
  subHeader?: React.ReactNode
  subHeaderTypography?: ResponsiveStyleValue<string | undefined>
  subHeaderStyles?: SxProps<Theme>
  extraHeader?: React.ReactNode
  extraActions?: React.ReactNode
}

/**
 * A full-width banner component that supports a background image, title, description,
 * navigation text.
 */
const TYPOGRAPHY_DEFAULTS = {
  defaultHeaderTypography: { xs: "h2", md: "h1" },
  defaultSubHeaderTypography: { xs: "body2", md: "body1" },
}
const Banner = ({
  backgroundUrl = DEFAULT_BACKGROUND_IMAGE_URL,
  backgroundSize = "cover",
  backgroundDim = 0,
  navText,
  avatar,
  title,
  titleTypography = TYPOGRAPHY_DEFAULTS.defaultHeaderTypography,
  titleStyles,
  header,
  subHeader,
  subHeaderTypography = TYPOGRAPHY_DEFAULTS.defaultSubHeaderTypography,
  subHeaderStyles,
  extraHeader,
  extraActions,
}: BannerProps) => {
  return (
    <BannerBackground
      backgroundUrl={backgroundUrl}
      backgroundSize={backgroundSize}
      backgroundDim={backgroundDim}
    >
      <Container>
        {navText}
        <InnerContainer>
          <HeaderContainer>
            {avatar ? <div>{avatar}</div> : null}
            <Typography
              component="h1"
              variant="h1"
              typography={titleTypography}
              sx={titleStyles}
            >
              {title}
            </Typography>
            <ActionsContainerMobile>{extraActions}</ActionsContainerMobile>
            {header && (
              <SubHeader
                variant="body1"
                typography={subHeaderTypography}
                sx={subHeaderStyles}
              >
                {header}
              </SubHeader>
            )}
            {subHeader && (
              <SubHeader
                variant="body1"
                typography={subHeaderTypography}
                sx={subHeaderStyles}
              >
                {subHeader}
              </SubHeader>
            )}
            {extraHeader ? extraHeader : null}
          </HeaderContainer>
          <ActionsContainerDesktop>{extraActions}</ActionsContainerDesktop>
        </InnerContainer>
      </Container>
    </BannerBackground>
  )
}

export { Banner, BannerBackground }
export type { BannerProps, BannerBackgroundProps }
