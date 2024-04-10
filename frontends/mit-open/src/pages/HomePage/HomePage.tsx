import React from "react"
import { Container } from "ol-components"
import TabbedCarousel, {
  TabbedCarouselProps,
} from "@/page-components/TabbedCarousel/TabbedCarousel"
import HeroSearch from "./HeroSearch"

const UPCOMING_COURSES_CAROUSEL: TabbedCarouselProps["config"] = [
  {
    label: "All",
    pageSize: 4,
    data: {
      type: "resources_upcoming",
      params: { resource_type: ["course"], limit: 12 },
    },
  },
  {
    label: "Professional",
    pageSize: 4,
    data: {
      type: "resources_upcoming",
      params: { professional: true, resource_type: ["course"], limit: 12 },
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

const HomePage: React.FC = () => {
  return (
    <Container>
      <HeroSearch />
      <section>
        <h2>Upcoming Courses</h2>
        <TabbedCarousel config={UPCOMING_COURSES_CAROUSEL} />
      </section>
      <section>
        <h2>Media</h2>
        <TabbedCarousel config={MEDIA_CAROUSEL} />
      </section>
    </Container>
  )
}

export default HomePage
