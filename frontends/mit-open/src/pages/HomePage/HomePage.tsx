import React from "react"
import { Container, styled } from "ol-components"
import HeroSearch from "./HeroSearch"
import FeaturedResourcesSection from "./FeaturedResourcesSection"
import MediaSection from "./MediaSection"
import BrowseTopicsSection from "./BrowseTopicsSection"
import NewsEventsSection from "./NewsEventsSection"
import TestimonialsSection from "./TestimonialsSection"

const FullWidthBackground = styled.div({
  background: "linear-gradient(0deg, #FFF 0%, #E7EBEE 100%);",
})

const HomePage: React.FC = () => {
  return (
    <>
      <FullWidthBackground>
        <Container>
          <HeroSearch />
          <FeaturedResourcesSection />
        </Container>
      </FullWidthBackground>
      <MediaSection />
      <BrowseTopicsSection />
      <TestimonialsSection />
      <NewsEventsSection />
    </>
  )
}

export default HomePage
