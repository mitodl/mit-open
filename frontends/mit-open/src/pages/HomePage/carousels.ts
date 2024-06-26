import type { ResourceCarouselProps } from "@/page-components/ResourceCarousel/ResourceCarousel"
import type { FeaturedApiFeaturedListRequest as FeaturedListParams } from "api"

const FEATURED_COMMON_PARAMS: FeaturedListParams = {
  limit: 12,
}
const FEATURED_RESOURCES_CAROUSEL: ResourceCarouselProps["config"] = [
  {
    label: "All",
    cardProps: { size: "medium" },
    data: {
      type: "lr_featured",
      params: { ...FEATURED_COMMON_PARAMS },
    },
  },
  {
    label: "Free",
    cardProps: { size: "medium" },
    data: {
      type: "lr_featured",
      params: { ...FEATURED_COMMON_PARAMS, free: true },
    },
  },
  {
    label: "With Certificate",
    cardProps: { size: "medium" },
    data: {
      type: "lr_featured",
      params: {
        ...FEATURED_COMMON_PARAMS,
        certification: true,
        professional: false,
      },
    },
  },
  {
    label: "Professional & Executive Learning",
    cardProps: { size: "medium" },
    data: {
      type: "lr_featured",
      params: { ...FEATURED_COMMON_PARAMS, professional: true },
    },
  },
]

const MEDIA_CAROUSEL: ResourceCarouselProps["config"] = [
  {
    label: "All",
    cardProps: { size: "small", isMedia: true },
    data: {
      type: "resources",
      params: {
        resource_type: ["video", "podcast_episode"],
        limit: 12,
        sortby: "new",
      },
    },
  },
  {
    label: "Videos",
    cardProps: { size: "small", isMedia: true },
    data: {
      type: "resources",
      params: { resource_type: ["video"], limit: 12, sortby: "new" },
    },
  },
  {
    label: "Podcasts",
    cardProps: { size: "small", isMedia: true },
    data: {
      type: "resources",
      params: { resource_type: ["podcast_episode"], limit: 12, sortby: "new" },
    },
  },
]

export { FEATURED_RESOURCES_CAROUSEL, MEDIA_CAROUSEL }
