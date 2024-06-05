import React from "react"
import TabbedCarousel, {
  TabbedCarouselProps,
} from "@/page-components/TabbedCarousel/TabbedCarousel"

const MEDIA_CAROUSEL: TabbedCarouselProps["config"] = [
  {
    label: "All",
    cardProps: { size: "small" },
    data: {
      type: "resources",
      params: { resource_type: ["video", "podcast"], limit: 12 },
    },
  },
  {
    label: "Videos",
    cardProps: { size: "small" },
    data: {
      type: "resources",
      params: { resource_type: ["video"], limit: 12 },
    },
  },
  {
    label: "Podcasts",
    cardProps: { size: "small" },
    data: {
      type: "resources",
      params: { resource_type: ["podcast"], limit: 12 },
    },
  },
]

const MediaSection: React.FC = () => {
  return <TabbedCarousel title="Media" config={MEDIA_CAROUSEL} />
}

export default MediaSection
