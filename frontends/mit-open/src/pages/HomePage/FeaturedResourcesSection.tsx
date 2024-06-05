import React from "react"
import TabbedCarousel from "@/page-components/TabbedCarousel/TabbedCarousel"
import type { TabbedCarouselProps } from "@/page-components/TabbedCarousel/TabbedCarousel"
import type { FeaturedApiFeaturedListRequest as FeaturedListParams } from "api"

const COMMON_PARAMS: FeaturedListParams = {
  resource_type: ["course"],
  limit: 12,
}
const FEATURED_RESOURCES_CAROUSEL: TabbedCarouselProps["config"] = [
  {
    label: "All",
    pageSize: 4,
    size: "medium",
    data: {
      type: "lr_featured",
      params: { ...COMMON_PARAMS },
    },
  },
  {
    label: "Free",
    pageSize: 4,
    size: "medium",
    data: {
      type: "lr_featured",
      params: { ...COMMON_PARAMS, free: true },
    },
  },
  {
    label: "Certificate",
    pageSize: 4,
    size: "medium",
    data: {
      type: "lr_featured",
      params: { ...COMMON_PARAMS, certification: true },
    },
  },
  {
    label: "Professional",
    pageSize: 4,
    size: "medium",
    data: {
      type: "lr_featured",
      params: { ...COMMON_PARAMS, professional: true },
    },
  },
]

const FeaturedResourcesSection: React.FC = () => {
  return (
    <TabbedCarousel
      title="Featured Courses"
      config={FEATURED_RESOURCES_CAROUSEL}
    />
  )
}

export default FeaturedResourcesSection
