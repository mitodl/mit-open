import type { ResourceCarouselProps } from "@/page-components/ResourceCarousel/ResourceCarousel"
import { Profile } from "api/v0"

type UserDashboardCarouselConfig = (
  profile: Profile | undefined,
) => ResourceCarouselProps["config"]

const TOP_PICKS_CAROUSEL: UserDashboardCarouselConfig = (
  profile: Profile | undefined,
) => {
  return [
    {
      label: "All",
      cardProps: { size: "small" },
      data: {
        type: "lr_search",
        params: { resource_type: ["course"], limit: 12 },
        ...profile?.preference_search_filters,
      },
    },
  ]
}

export { TOP_PICKS_CAROUSEL }
