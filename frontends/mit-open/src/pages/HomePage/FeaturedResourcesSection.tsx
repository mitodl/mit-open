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

const COMMON_PARAMS: FeaturedListParams = {
  resource_type: ["course"],
  limit: 12,
}
const FEATURED_RESOURCES_CAROUSEL: TabbedCarouselProps["config"] = [
  {
    label: "All",
    pageSize: 4,
    data: {
      type: "lr_featured",
      params: { ...COMMON_PARAMS },
    },
  },
  {
    label: "Free",
    pageSize: 4,
    data: {
      type: "resources",
      params: { ...COMMON_PARAMS, free: true },
    },
  },
  {
    label: "Certificate",
    pageSize: 4,
    data: {
      type: "resources",
      params: { ...COMMON_PARAMS, certification: true },
    },
  },
  {
    label: "Professional",
    pageSize: 4,
    data: {
      type: "resources",
      params: { ...COMMON_PARAMS, professional: true },
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