import React from "react"
import { styled, ChipLink, Container } from "ol-components"
import { GridContainer } from "@/components/GridLayout/GridLayout"
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

const EXPLORE_BUTTONS = [
  {
    label: "Courses",
  },
  {
    label: "Videos",
  },
  {
    label: "Podcasts",
  },
  {
    label: "Learning Paths",
  },
  {
    label: "By Department",
  },
  {
    label: "By Subject",
  },
  {
    label: "From OCW",
  },
  {
    label: "From MITx",
  },
  {
    label: "With Certificate",
  },
  {
    label: "Micromasters",
  },
  {
    label: "Professional Education",
  },
]

const TopContainer = styled(GridContainer)`
  margin-top: 3.5rem;
  margin-bottom: 3.5rem;
`

const StyledChipLink = styled(ChipLink)`
  margin: 8px 16px 8px 0;
`

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
