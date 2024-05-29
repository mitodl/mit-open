import { Banner, Container, Typography, styled } from "ol-components"
import React from "react"

const OFFERORS_BANNER_IMAGE = "/static/images/background_steps.jpeg"

const Page = styled.div({})

const PageContent = styled.div({
  padding: "40px 10px 0px 10px",
  gap: "80px",
})

const ContentHeaderText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.black,
  maxWidth: "1000px",
  ...theme.typography.subtitle1,
}))

const OfferorsPage: React.FC = () => {
  return (
    <Page>
      <Banner
        navText="Home / MIT Units"
        title="Academic & Professional Learning"
        description="Extending MIT's knowledge to the world"
        backgroundUrl={OFFERORS_BANNER_IMAGE}
      />
      <Container>
        <PageContent>
          <ContentHeaderText>
            MIT is dedicated to advancing knowledge beyond students enrolled in
            MIT's campus programs. Several divisions within MIT offer
            educational opportunities accessible to learners worldwide, catering
            to a diverse range of needs.
          </ContentHeaderText>
        </PageContent>
      </Container>
    </Page>
  )
}

export default OfferorsPage
