import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { LearningResourceListCard } from "./LearningResourceListCard"
import { ResourceTypeEnum } from "api"
import { factories } from "api/test-utils"
import { withRouter } from "storybook-addon-react-router-v6"

const _makeResource = factories.learningResources.resource

const makeResource: typeof _makeResource = (overrides) => {
  const resource = _makeResource(overrides)
  resource.image!.url =
    "https://ocw.mit.edu/courses/res-hso-001-mit-haystack-observatory-k12-stem-lesson-plans/mitres_hso_001.jpg"
  return resource
}

const meta: Meta<typeof LearningResourceListCard> = {
  title: "smoot-design/Cards/LearningResourceListCard",
  argTypes: {
    resource: {
      options: ["Loading", ...Object.values(ResourceTypeEnum)],
      mapping: {
        Loading: undefined,
        [ResourceTypeEnum.Course]: makeResource({
          resource_type: ResourceTypeEnum.Course,
        }),
        [ResourceTypeEnum.Program]: makeResource({
          resource_type: ResourceTypeEnum.Program,
        }),
        [ResourceTypeEnum.Video]: makeResource({
          resource_type: ResourceTypeEnum.Video,
          url: "https://www.youtube.com/watch?v=-E9hf5RShzQ",
        }),
        [ResourceTypeEnum.VideoPlaylist]: makeResource({
          resource_type: ResourceTypeEnum.VideoPlaylist,
        }),
        [ResourceTypeEnum.Podcast]: makeResource({
          resource_type: ResourceTypeEnum.Podcast,
        }),
        [ResourceTypeEnum.PodcastEpisode]: makeResource({
          resource_type: ResourceTypeEnum.PodcastEpisode,
        }),
        [ResourceTypeEnum.LearningPath]: makeResource({
          resource_type: ResourceTypeEnum.LearningPath,
        }),
      },
    },
    onAddToLearningPathClick: {
      action: "click-add-to-learning-path",
    },
    onAddToUserListClick: {
      action: "click-add-to-user-list",
    },
  },
  render: ({
    resource,
    isLoading,
    onAddToLearningPathClick,
    onAddToUserListClick,
    draggable,
  }) => (
    <LearningResourceListCard
      resource={resource}
      isLoading={isLoading}
      href={`/?resource=${resource?.id}`}
      onAddToLearningPathClick={onAddToLearningPathClick}
      onAddToUserListClick={onAddToUserListClick}
      draggable={draggable}
    />
  ),
  decorators: [withRouter],
}

export default meta

type Story = StoryObj<typeof LearningResourceListCard>

export const FreeCourseNoCertificate: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: true,
      certification: false,
      prices: [],
    }),
  },
}

export const FreeCourseWithCertificateOnePrice: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: true,
      certification: true,
      prices: ["250"],
    }),
  },
}

export const FreeCourseWithCertificatePriceRange: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: true,
      certification: true,
      prices: ["250", "1000"],
    }),
  },
}

export const UnknownPriceCourseWithoutCertificate: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: false,
      certification: false,
      prices: [],
    }),
  },
}

export const UnknownPriceCourseWithCertificate: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: false,
      certification: true,
      prices: [],
    }),
  },
}

export const PaidCourseWithoutCertificate: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: false,
      certification: false,
      prices: ["1000"],
    }),
  },
}

export const PaidCourseWithCertificateOnePrice: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: false,
      certification: true,
      prices: ["1000"],
    }),
  },
}

export const PaidCourseWithCertificatePriceRange: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: false,
      certification: true,
      prices: ["250", "1000"],
    }),
  },
}

export const LearningPath: Story = {
  args: {
    resource: makeResource({ resource_type: ResourceTypeEnum.LearningPath }),
  },
}

export const Program: Story = {
  args: {
    resource: makeResource({ resource_type: ResourceTypeEnum.Program }),
  },
}

export const Podcast: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.Podcast,
      free: true,
    }),
  },
}

export const PodcastEpisode: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.PodcastEpisode,
      free: true,
    }),
  },
}

export const Video: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.Video,
      url: "https://www.youtube.com/watch?v=4A9bGL-_ilA",
      free: true,
    }),
  },
}

export const VideoPlaylist: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.VideoPlaylist,
      free: true,
    }),
  },
}

export const Loading: Story = {
  args: {
    isLoading: true,
  },
}

export const Draggable: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
    }),
    draggable: true,
  },
}
