import React from "react"
import styled from "@emotion/styled"
import Typography from "@mui/material/Typography"
import Container from "@mui/material/Container"
import { ResponsiveStyleValue, SxProps } from "@mui/system"
import { Theme } from "../ThemeProvider/ThemeProvider"

const SubHeader = styled(Typography)({
  maxWidth: "700px",
  marginTop: "8px",
})

type BannerWrapperProps = {
  backgroundUrl: string
  backgroundSize?: string
  backgroundDim?: number
  containerPadding?: string
}

/**
 * This is a full-width banner component that takes a background image URL.
 */
const BannerWrapper = styled.header<BannerWrapperProps>(
  ({
    theme,
    backgroundUrl,
    backgroundSize = "cover",
    backgroundDim = 0,
    containerPadding = "48px 0 48px 0",
  }) => ({
    backgroundAttachment: "fixed",
    backgroundImage: backgroundDim
      ? `linear-gradient(rgba(0 0 0 / ${backgroundDim}%), rgba(0 0 0 / ${backgroundDim}%)), url('${backgroundUrl}')`
      : `url(${backgroundUrl})`,
    backgroundSize: backgroundSize,
    backgroundRepeat: "no-repeat",
    color: theme.custom.colors.white,
    padding: containerPadding,
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

type BannerProps = BannerWrapperProps & {
  backgroundUrl: string
  backgroundSize?: string
  backgroundDim?: number
  containerPadding?: string
  navText: React.ReactNode
  avatar?: React.ReactNode
  header: React.ReactNode
  headerTypography?: ResponsiveStyleValue<string | undefined>
  headerStyles?: SxProps<Theme>
  subHeader?: React.ReactNode
  subHeaderTypography?: ResponsiveStyleValue<string | undefined>
  subHeaderStyles?: SxProps<Theme>
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
  containerPadding = "48px 0 48px 0",
  navText,
  avatar,
  header,
  headerTypography,
  headerStyles,
  subHeader,
  subHeaderTypography,
  subHeaderStyles,
  extraHeader,
  extraRight,
}: BannerProps) => {
  const defaultHeaderTypography = { xs: "h2", md: "h1" }
  const defaultSubHeaderTypography = { xs: "body2", md: "body1" }
  return (
    <BannerWrapper
      backgroundUrl={backgroundUrl}
      backgroundSize={backgroundSize}
      backgroundDim={backgroundDim}
      containerPadding={containerPadding}
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
              typography={subHeaderTypography || defaultSubHeaderTypography}
              sx={subHeaderStyles}
            >
              {subHeader}
            </SubHeader>
            <div>{extraHeader}</div>
          </HeaderContainer>
          <RightContainer>{extraRight}</RightContainer>
        </InnerContainer>
      </Container>
    </BannerWrapper>
  )
}

export { Banner }
export type { BannerProps }
