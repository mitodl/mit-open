import React from "react"
import { Container } from "ol-components"
import HeroSearch from "./HeroSearch"
import FeaturedResourcesSection from "./FeaturedResourcesSection"
import MediaSection from "./MediaSection"
import BrowseTopicsSection from "./BrowseTopicsSection"
import NewsEventsSection from "./NewsEventsSection"

const HomePage: React.FC = () => {
  return (
    <>
      <Container>
        <HeroSearch />
      </Container>
      <FeaturedResourcesSection />
      <MediaSection />
      <BrowseTopicsSection />
      <NewsEventsSection />
    </>
  )
}

export default HomePage
