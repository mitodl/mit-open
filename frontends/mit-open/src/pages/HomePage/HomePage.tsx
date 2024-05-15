import React from "react"
import { Container, styled } from "ol-components"
import TabbedCarousel, {
  TabbedCarouselProps,
} from "@/page-components/TabbedCarousel/TabbedCarousel"
import HeroSearch from "./HeroSearch"
import NewsEventsSection from "./NewsEventsSection"

const UPCOMING_COURSES_CAROUSEL: TabbedCarouselProps["config"] = [
  {
    label: "All",
    pageSize: 4,
    data: {
      type: "resources",
      params: { resource_type: ["course"], limit: 12, sortby: "upcoming" },
    },
  },
  {
    label: "Professional",
    pageSize: 4,
    data: {
      type: "resources",
      params: {
        professional: true,
        resource_type: ["course"],
        limit: 12,
        sortby: "upcoming",
      },
    },
  },
]

const MEDIA_CAROUSEL: TabbedCarouselProps["config"] = [
  {
    label: "All",
    pageSize: 6,
    data: {
      type: "resources",
      params: { resource_type: ["video", "podcast"], limit: 12 },
    },
  },
  {
    label: "Videos",
    pageSize: 6,
    data: {
      type: "resources",
      params: { resource_type: ["video"], limit: 12 },
    },
  },
  {
    label: "Podcasts",
    pageSize: 6,
    data: {
      type: "resources",
      params: { resource_type: ["podcast"], limit: 12 },
    },
  },
]

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
    padding-top: 56px;
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
      <Container>
        <section>
          <h2>Upcoming Courses</h2>
          <TabbedCarousel config={UPCOMING_COURSES_CAROUSEL} />
        </section>
        <section>
          <h2>Media</h2>
          <TabbedCarousel config={MEDIA_CAROUSEL} />
        </section>
      </Container>
      <NewsEventsSection />
    </>
  )
}

export default HomePage
