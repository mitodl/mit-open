import React from "react"
import styled from "@emotion/styled"
import Typography from "@mui/material/Typography"
import Container from "@mui/material/Container"

const Description = styled(Typography)(({ theme }) => ({
  maxWidth: "700px",
  marginTop: "8px",
  [theme.breakpoints.down("sm")]: {
    marginTop: "16px",
  },
}))

type BannerWrapperProps = {
  backgroundUrl: string
}

/**
 * This is a full-width banner component that takes a background image URL.
 */
const BannerWrapper = styled.div<BannerWrapperProps>(
  ({ theme, backgroundUrl }) => ({
    backgroundImage: `url(${backgroundUrl})`,
    backgroundSize: "cover",
    color: theme.custom.colors.white,
    paddingTop: "48px",
    paddingBottom: "48px",
    [theme.breakpoints.down("sm")]: {
      paddingTop: "32px",
      paddingBottom: "32px",
    },
  }),
)

const NavText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.lightGray2,
  marginBottom: "4px",
}))

const InnerContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
  },
}))

const TitleContainer = styled.div({
  display: "flex",
  flexDirection: "column",
})

const ActionsContainer = styled.div({
  display: "flex",
  flexDirection: "row",
})

type BannerProps = BannerWrapperProps & {
  description: React.ReactNode
  title: React.ReactNode
  navText: React.ReactNode
  action?: React.ReactNode
}

/**
 * A full-width banner component that supports a background image, title, description,
 * navigation text.
 */
const Banner = ({
  backgroundUrl,
  description,
  title,
  navText,
  action,
}: BannerProps) => {
  return (
    <BannerWrapper backgroundUrl={backgroundUrl}>
      <Container>
        <InnerContainer>
          <TitleContainer>
            <NavText variant="subtitle3">{navText}</NavText>
            <Typography component="h1" typography={{ xs: "h2", md: "h1" }}>
              {title}
            </Typography>
            <Description typography={{ xs: "body2", md: "body1" }}>
              {description}
            </Description>
          </TitleContainer>
          <ActionsContainer>{action}</ActionsContainer>
        </InnerContainer>
      </Container>
    </BannerWrapper>
  )
}

export { Banner }
export type { BannerProps }
