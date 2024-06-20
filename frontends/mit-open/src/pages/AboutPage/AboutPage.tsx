import { Breadcrumbs, Container, Typography, styled } from "ol-components"
import { MetaTags } from "ol-utilities"
import * as urls from "@/common/urls"
import React from "react"

const PageContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  alignSelf: "stretch",
  padding: "40px 84px 80px 84px",
  [theme.breakpoints.down("md")]: {
    padding: "40px 24px 80px 24px",
  },
}))

const BannerContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingBottom: "16px",
})

const BannerContainerInner = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  alignSelf: "stretch",
  justifyContent: "center",
})

const Header = styled(Typography)(({ theme }) => ({
  alignSelf: "stretch",
  color: theme.custom.colors.black,
}))

const BodyContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  alignSelf: "stretch",
  gap: "40px",
})

const SubHeaderContainer = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  alignSelf: "stretch",
  gap: "30px",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column-reverse",
    gap: "16px",
  },
}))

const SubHeaderText = styled(Typography)(({ theme }) => ({
  flex: "1 0 0",
  color: theme.custom.colors.black,
}))

const SubHeaderImage = styled.img(({ theme }) => ({
  flexGrow: 1,
  alignSelf: "stretch",
  borderRadius: "8px",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundImage: "url('/static/images/mit-dome-2.jpg')",
  [theme.breakpoints.down("md")]: {
    height: "300px",
  },
}))

const BodyText = styled(Typography)(({ theme }) => ({
  alignSelf: "stretch",
  color: theme.custom.colors.black,
}))

const AboutPage: React.FC = () => {
  return (
    <Container>
      <PageContainer>
        <MetaTags title="About Us" />
        <BannerContainer>
          <BannerContainerInner>
            <Breadcrumbs
              variant="light"
              ancestors={[{ href: urls.HOME, label: "Home" }]}
              current="About Us"
            />
            <Header variant="h3">About Us</Header>
          </BannerContainerInner>
        </BannerContainer>
        <BodyContainer>
          <SubHeaderContainer>
            <SubHeaderText variant="h4">
              The MIT community is driven by a shared purpose: to make a better
              world through education, research, and innovation. We are fun and
              quirky, elite but not elitist, inventive and artistic, obsessed
              with numbers, and welcoming to talented people regardless of where
              they come from.
            </SubHeaderText>
            <SubHeaderImage />
          </SubHeaderContainer>
          <BodyText variant="body3">
            Founded to accelerate the nation's industrial revolution, MIT is
            profoundly American. With ingenuity and drive, our graduates have
            invented fundamental technologies, launched new industries, and
            created millions of American jobs. At the same time, and without the
            slightest sense of contradiction, MIT is profoundly global. Our
            community gains tremendous strength as a magnet for talent from
            around the world. Through teaching, research, and innovation, MIT's
            exceptional community pursues its mission of service to the nation
            and the world.
          </BodyText>
          <BodyText variant="body3">
            Founded to accelerate the nation's industrial revolution, MIT is
            profoundly American. With ingenuity and drive, our graduates have
            invented fundamental technologies, launched new industries, and
            created millions of American jobs. At the same time, and without the
            slightest sense of contradiction, MIT is profoundly global. Our
            community gains tremendous strength as a magnet for talent from
            around the world. Through teaching, research, and innovation, MIT's
            exceptional community pursues its mission of service to the nation
            and the world. Founded to accelerate the nation's industrial
            revolution, MIT is profoundly American. With ingenuity and drive,
            our graduates have invented fundamental technologies, launched new
            industries, and created millions of American jobs. At the same time,
            and without the slightest sense of contradiction, MIT is profoundly
            global. Our community gains tremendous strength as a magnet for
            talent from around the world. Through teaching, research, and
            innovation, MIT's exceptional community pursues its mission of
            service to the nation and the world.
          </BodyText>
        </BodyContainer>
      </PageContainer>
    </Container>
  )
}

export default AboutPage
