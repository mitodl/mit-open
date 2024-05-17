import React from "react"
import { Container, styled, Typography } from "ol-components"
import TabbedCarousel, {
  TabbedCarouselProps,
} from "@/page-components/TabbedCarousel/TabbedCarousel"

const Section = styled.section`
  padding: 80px 0;
  overflow: auto;
  ${({ theme }) => theme.breakpoints.down("md")} {
    padding: 40px 0;
  }
`

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

const UpcomingCoursesSection: React.FC = () => {
  return (
    <Section>
      <Container>
        <Typography variant="h2">Upcoming Courses</Typography>
        <TabbedCarousel config={UPCOMING_COURSES_CAROUSEL} />
      </Container>
    </Section>
  )
}

export default UpcomingCoursesSection
