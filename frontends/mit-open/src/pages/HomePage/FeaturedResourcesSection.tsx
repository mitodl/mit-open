import React from "react"
import { Container, styled, Typography } from "ol-components"
import TabbedCarousel from "@/page-components/TabbedCarousel/TabbedCarousel"
import type { TabbedCarouselProps } from "@/page-components/TabbedCarousel/TabbedCarousel"
import type { FeaturedApiFeaturedListRequest as FeaturedListParams } from "api"

const Section = styled.section`
  padding: 80px 0;
  overflow: auto;
  ${({ theme }) => theme.breakpoints.down("md")} {
    padding: 40px 0;
  }
`

const SORT_AND_PAGE: FeaturedListParams = {
  resource_type: ["course"],
  limit: 12,
  sortby: "upcoming",
}
const FEATURED_RESOURCES_CAROUSEL: TabbedCarouselProps["config"] = [
  {
    label: "Free",
    pageSize: 4,
    data: {
      type: "resources",
      params: { ...SORT_AND_PAGE, free: true },
    },
  },
  {
    label: "Certificate",
    pageSize: 4,
    data: {
      type: "resources",
      params: { ...SORT_AND_PAGE, certification: true },
    },
  },
  {
    label: "Professional",
    pageSize: 4,
    data: {
      type: "resources",
      params: { ...SORT_AND_PAGE, professional: true },
    },
  },
]

const FeaturedResourcesSection: React.FC = () => {
  return (
    <Section>
      <Container>
        <Typography variant="h2">Featured Courses</Typography>
        <TabbedCarousel config={FEATURED_RESOURCES_CAROUSEL} />
      </Container>
    </Section>
  )
}

export default FeaturedResourcesSection
