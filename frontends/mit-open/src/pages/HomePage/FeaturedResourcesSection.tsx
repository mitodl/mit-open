import React from "react"
import ResourceCarousel from "@/page-components/ResourceCarousel/ResourceCarousel"
import type { TabConfig } from "@/page-components/ResourceCarousel/ResourceCarousel"
import type { FeaturedApiFeaturedListRequest as FeaturedListParams } from "api"

const COMMON_DATA_PARAMS: FeaturedListParams = {
  resource_type: ["course"],
  limit: 12,
}
const FEATURED_RESOURCES_CAROUSEL: TabConfig[] = [
  {
    label: "All",
    cardProps: { size: "medium" },
    data: {
      type: "lr_featured",
      params: { ...COMMON_DATA_PARAMS },
    },
  },
  {
    label: "Free",
    cardProps: { size: "medium" },
    data: {
      type: "lr_featured",
      params: { ...COMMON_DATA_PARAMS, free: true },
    },
  },
  {
    label: "Certificate",
    cardProps: { size: "medium" },
    data: {
      type: "lr_featured",
      params: { ...COMMON_DATA_PARAMS, certification: true },
    },
  },
  {
    label: "Professional and Executive Education",
    cardProps: { size: "medium" },
    data: {
      type: "lr_featured",
      params: { ...COMMON_DATA_PARAMS, professional: true },
    },
  },
]

const FeaturedResourcesSection: React.FC = () => {
  return (
    <ResourceCarousel
      title="Featured Courses"
      config={FEATURED_RESOURCES_CAROUSEL}
    />
  )
}

export default FeaturedResourcesSection
