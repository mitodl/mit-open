import React from "react"
import { Container, styled } from "ol-components"
import HeroSearch from "./HeroSearch"
import BrowseTopicsSection from "./BrowseTopicsSection"
import NewsEventsSection from "./NewsEventsSection"
import TestimonialsSection from "./TestimonialsSection"
import ResourceCarousel from "@/page-components/ResourceCarousel/ResourceCarousel"
import * as carousels from "./carousels"

const FullWidthBackground = styled.div({
  background: "linear-gradient(0deg, #FFF 0%, #E7EBEE 100%);",
})

const FeaturedCoursesCarousel = styled(ResourceCarousel)(({ theme }) => ({
  margin: "80px 0",
  [theme.breakpoints.down("sm")]: {
    marginTop: "0px",
    marginBottom: "32px",
  },
}))
const MediaCarousel = styled(ResourceCarousel)(({ theme }) => ({
  margin: "80px 0",
  [theme.breakpoints.down("sm")]: {
    margin: "40px 0",
  },
}))

const HomePage: React.FC = () => {
  return (
    <>
      <FullWidthBackground>
        <Container>
          <HeroSearch />
          <FeaturedCoursesCarousel
            title="Featured Courses"
            config={carousels.FEATURED_RESOURCES_CAROUSEL}
          />
        </Container>
      </FullWidthBackground>
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
