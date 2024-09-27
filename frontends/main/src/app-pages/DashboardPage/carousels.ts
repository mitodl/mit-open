import type { ResourceCarouselProps } from "@/page-components/ResourceCarousel/ResourceCarousel"
import { LearningResourcesSearchRetrieveDeliveryEnum } from "api/v1"
import { Profile } from "api/v0"

type TopPicksCarouselConfigProps = (
  profile: Profile | undefined,
) => ResourceCarouselProps["config"]

const TopPicksCarouselConfig: TopPicksCarouselConfigProps = (
  profile: Profile | undefined,
) => {
  const certification: boolean | undefined =
    profile?.preference_search_filters.certification
  const topics = profile?.preference_search_filters.topic
  const delivery = Object.values(
    LearningResourcesSearchRetrieveDeliveryEnum,
  ).filter((format) =>
    profile?.preference_search_filters.delivery?.includes(format),
  )
  return [
    {
      label: "All",
      cardProps: { size: "small" },
      data: {
        type: "lr_search",
        params: {
          resource_type: ["course"],
          limit: 12,
          certification: certification,
          topic: topics,
          delivery: delivery,
          sortby: "-views",
        },
      },
    },
  ]
}

type TopicCarouselConfigProps = (
  topic: string | undefined,
) => ResourceCarouselProps["config"]

const TopicCarouselConfig: TopicCarouselConfigProps = (
  topic: string | undefined,
) => {
  return [
    {
      label: "All",
      cardProps: { size: "small" },
      data: {
        type: "lr_search",
        params: {
          resource_type: ["course"],
          limit: 12,
          topic: [topic || ""],
          sortby: "-views",
        },
      },
    },
  ]
}

const CERTIFICATE_COURSES_CAROUSEL: ResourceCarouselProps["config"] = [
  {
    label: "All",
    cardProps: { size: "small" },
    data: {
      type: "lr_search",
      params: {
        resource_type: ["course"],
        limit: 12,
        certification: true,
        sortby: "-views",
      },
    },
  },
]

const FREE_COURSES_CAROUSEL: ResourceCarouselProps["config"] = [
  {
    label: "All",
    cardProps: { size: "small" },
    data: {
      type: "lr_search",
      params: {
        resource_type: ["course"],
        limit: 12,
        free: true,
        sortby: "-views",
      },
    },
  },
]

const NEW_LEARNING_RESOURCES_CAROUSEL: ResourceCarouselProps["config"] = [
  {
    label: "All",
    cardProps: { size: "small" },
    data: {
      type: "lr_search",
      params: { limit: 12, sortby: "new" },
    },
  },
]

const POPULAR_LEARNING_RESOURCES_CAROUSEL: ResourceCarouselProps["config"] = [
  {
    label: "All",
    cardProps: { size: "small" },
    data: {
      type: "lr_search",
      params: { limit: 12, sortby: "-views" },
    },
  },
]

export {
  TopPicksCarouselConfig,
  TopicCarouselConfig,
  CERTIFICATE_COURSES_CAROUSEL,
  FREE_COURSES_CAROUSEL,
  NEW_LEARNING_RESOURCES_CAROUSEL,
  POPULAR_LEARNING_RESOURCES_CAROUSEL,
}
