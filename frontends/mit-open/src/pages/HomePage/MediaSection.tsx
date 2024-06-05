import React from "react"
import { Container, Typography, styled, theme } from "ol-components"
import TabbedCarousel, {
  TabbedCarouselProps,
} from "@/page-components/TabbedCarousel/TabbedCarousel"

const Section = styled.section`
  background-color: ${theme.custom.colors.white};
  overflow: auto;
  padding: 80px 0;
  ${({ theme }) => theme.breakpoints.down("md")} {
    padding: 40px 0;
  }
`

const MEDIA_CAROUSEL: TabbedCarouselProps["config"] = [
  {
    label: "All",
    pageSize: 6,
    size: "small",
    data: {
      type: "resources",
      params: { resource_type: ["video", "podcast"], limit: 12 },
    },
  },
  {
    label: "Videos",
    pageSize: 6,
    size: "small",
    data: {
      type: "resources",
      params: { resource_type: ["video"], limit: 12 },
    },
  },
  {
    label: "Podcasts",
    pageSize: 6,
    size: "small",
    data: {
      type: "resources",
      params: { resource_type: ["podcast"], limit: 12 },
    },
  },
]

const MediaSection: React.FC = () => {
  return (
    <Section>
      <Container>
        <Typography variant="h2">Media</Typography>
        <TabbedCarousel config={MEDIA_CAROUSEL} />
      </Container>
    </Section>
  )
}

export default MediaSection
