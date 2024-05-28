import React from "react"
import { Container, styled } from "ol-components"
import HeroSearch from "./HeroSearch"
import FeaturedResourcesSection from "./FeaturedResourcesSection"
import MediaSection from "./MediaSection"
import BrowseTopicsSection from "./BrowseTopicsSection"
import NewsEventsSection from "./NewsEventsSection"

const FullWidthBackground = styled.div`
  background-image: linear-gradient(
      90deg,
      rgb(255 255 255 / 100%) 0%,
      rgb(255 255 255 / 80%) 100%
    ),
    url("/static/images/hero-background-texture.jpeg");
  background-size: cover;
  padding-top: 120px;
  padding-bottom: 120px;

  ${({ theme }) => theme.breakpoints.down("sm")} {
    padding-top: 80px;
    padding-bottom: 56px;
  }
`

const HomePage: React.FC = () => {
  return (
    <>
      <FullWidthBackground>
        <Container>
          <HeroSearch />
        </Container>
      </FullWidthBackground>
      <FeaturedResourcesSection />
      <MediaSection />
      <BrowseTopicsSection />
      <NewsEventsSection />
    </>
  )
}

export default HomePage
