import React from "react"
import { Container, styled } from "ol-components"
import { MetaTags } from "ol-utilities"
import HeroSearch from "./HeroSearch"
import BrowseTopicsSection from "./BrowseTopicsSection"
import NewsEventsSection from "./NewsEventsSection"
import TestimonialsSection from "./TestimonialsSection"
import ResourceCarousel from "@/page-components/ResourceCarousel/ResourceCarousel"
import PersonalizeSection from "./PersonalizeSection"
import * as carousels from "./carousels"

const FullWidthBackground = styled.div(({ theme }) => ({
  background: "linear-gradient(0deg, #FFF 0%, #E9ECEF 100%);",
  paddingBottom: "80px",
  [theme.breakpoints.down("md")]: {
    paddingBottom: "40px",
  },
  [theme.breakpoints.down("sm")]: {
    paddingBottom: "32px",
  },
}))

const FeaturedCoursesCarousel = styled(ResourceCarousel)(({ theme }) => ({
  marginTop: "16px",
  [theme.breakpoints.down("sm")]: {
    marginTop: "0px",
  },
}))
const MediaCarousel = styled(ResourceCarousel)(({ theme }) => ({
  margin: "80px 0",
  minHeight: "388px",
  [theme.breakpoints.down("md")]: {
    margin: "40px 0",
    minHeight: "418px",
  },
}))

const HomePage: React.FC = () => {
  return (
    <>
      <MetaTags title="Learn with MIT" />
      <FullWidthBackground>
        <Container>
          <HeroSearch />
          <FeaturedCoursesCarousel
            title="Featured Courses"
            config={carousels.FEATURED_RESOURCES_CAROUSEL}
          />
        </Container>
      </FullWidthBackground>
      <PersonalizeSection />
      <Container>
        <MediaCarousel title="Media" config={carousels.MEDIA_CAROUSEL} />
      </Container>
      <BrowseTopicsSection />
      <TestimonialsSection />
      <NewsEventsSection />
    </>
  )
}

export default HomePage
