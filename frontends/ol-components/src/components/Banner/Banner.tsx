import React from "react"
import styled from "@emotion/styled"
import Typography from "@mui/material/Typography"
import Container from "@mui/material/Container"
import { ResponsiveStyleValue, SxProps } from "@mui/system"
import { Theme } from "../ThemeProvider/ThemeProvider"

const SubHeader = styled(Typography)({
  maxWidth: "700px",
  marginTop: "8px",
  marginBottom: "16px",
})

const ExtraHeader = styled(Typography)({
  marginBottom: "16px",
})

type BannerBackgroundProps = {
  backgroundUrl: string
  backgroundSize?: string
  backgroundDim?: number
}

/**
 * This is a full-width banner component that takes a background image URL.
 */
const BannerBackground = styled.div<BannerBackgroundProps>(
  ({ theme, backgroundUrl, backgroundDim = 0 }) => ({
    backgroundAttachment: "fixed",
    backgroundImage: backgroundDim
      ? `linear-gradient(rgba(0 0 0 / ${backgroundDim}%), rgba(0 0 0 / ${backgroundDim}%)), url('${backgroundUrl}')`
      : `url(${backgroundUrl})`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    color: theme.custom.colors.white,
    padding: "48px 0 48px 0",
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

const RightContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  [theme.breakpoints.down("md")]: {
    width: "100%",
  },
}))

type BannerProps = BannerBackgroundProps & {
  backgroundUrl: string
  backgroundSize?: string
  backgroundDim?: number
  navText: React.ReactNode
  avatar?: React.ReactNode
  header: React.ReactNode
  headerTypography?: ResponsiveStyleValue<string | undefined>
  headerStyles?: SxProps<Theme>
  subheader?: React.ReactNode
  subheaderTypography?: ResponsiveStyleValue<string | undefined>
  subheaderStyles?: SxProps<Theme>
  extraHeader?: React.ReactNode
  extraRight?: React.ReactNode
}

/**
 * A full-width banner component that supports a background image, title, description,
 * navigation text.
 */
const Banner = ({
  backgroundUrl,
  backgroundSize = "cover",
  backgroundDim = 0,
  navText,
  avatar,
  header,
  headerTypography,
  headerStyles,
  subheader,
  subheaderTypography,
  subheaderStyles,
  extraHeader,
  extraRight,
}: BannerProps) => {
  const defaultHeaderTypography = { xs: "h2", md: "h1" }
  const defaultSubHeaderTypography = { xs: "body2", md: "body1" }
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
              variant="h1"
              typography={headerTypography || defaultHeaderTypography}
              sx={headerStyles}
            >
              {header}
            </Typography>
            <SubHeader
              variant="body1"
              typography={subheaderTypography || defaultSubHeaderTypography}
              sx={subheaderStyles}
            >
              {subheader}
            </SubHeader>
            <ExtraHeader
              variant="body1"
              typography={subheaderTypography || defaultSubHeaderTypography}
              sx={subheaderStyles}
            >
              {extraHeader}
            </ExtraHeader>
          </HeaderContainer>
          <RightContainer>{extraRight}</RightContainer>
        </InnerContainer>
      </Container>
    </BannerBackground>
  )
}

export { Banner, BannerBackground }
export type { BannerProps, BannerBackgroundProps }
