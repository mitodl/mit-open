import type { ResourceCarouselProps } from "@/page-components/ResourceCarousel/ResourceCarousel"
import { LearningResourcesSearchRetrieveLearningFormatEnum } from "api"
import { Profile } from "api/v0"

type TopPicksCarouselConfigProps = (
  profile: Profile | undefined,
) => ResourceCarouselProps["config"]

const TOP_PICKS_CAROUSEL: TopPicksCarouselConfigProps = (
  profile: Profile | undefined,
) => {
  const certification: boolean | undefined =
    profile?.preference_search_filters.certification
  const topics = profile?.preference_search_filters.topic
  const learningFormat = Object.values(
    LearningResourcesSearchRetrieveLearningFormatEnum,
  ).filter((format) =>
    profile?.preference_search_filters.learning_format?.includes(format),
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
          learning_format: learningFormat,
        },
      },
    },
  ]
}

type TopicCarouselConfigProps = (
  topic: string | undefined,
) => ResourceCarouselProps["config"]

const TOPIC_CAROUSEL: TopicCarouselConfigProps = (
  topic: string | undefined,
) => {
  return [
    {
      label: "All",
      cardProps: { size: "small" },
      data: {
        type: "lr_search",
        params: { resource_type: ["course"], limit: 12, topic: [topic || ""] },
      },
    },
  ]
}

type CertificationCarouselConfigProps = (
  certification: boolean | undefined,
) => ResourceCarouselProps["config"]

const CERTIFICATION_CAROUSEL: CertificationCarouselConfigProps = (
  certification: boolean | undefined,
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
          certification: certification,
        },
      },
    },
  ]
}

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
      params: { limit: 12, sortby: "views" },
    },
  },
]

export {
  TOP_PICKS_CAROUSEL,
  TOPIC_CAROUSEL,
  CERTIFICATION_CAROUSEL,
  NEW_LEARNING_RESOURCES_CAROUSEL,
  POPULAR_LEARNING_RESOURCES_CAROUSEL,
}
