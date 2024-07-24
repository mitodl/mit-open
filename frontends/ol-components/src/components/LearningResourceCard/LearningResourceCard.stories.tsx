import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import {
  LearningResourceCard,
  LearningResourceCardProps,
} from "./LearningResourceCard"
import { LearningResource, ResourceTypeEnum } from "api"
import styled from "@emotion/styled"
import { factories } from "api/test-utils"
import { withRouter } from "storybook-addon-react-router-v6"
import Stack from "@mui/system/Stack"
import _ from "lodash"

const _makeResource = factories.learningResources.resource

const makeResource: typeof _makeResource = (overrides) => {
  const resource = _makeResource(overrides)
  if (resource.image) {
    resource.image.url =
      "https://ocw.mit.edu/courses/res-hso-001-mit-haystack-observatory-k12-stem-lesson-plans/mitres_hso_001.jpg"
  }
  return resource
}

const LearningResourceCardStyled = styled(LearningResourceCard)`
  width: 300px;
`
type StoryProps = LearningResourceCardProps & {
  excerpt: (keyof LearningResource)[]
}

const meta: Meta<StoryProps> = {
  title: "smoot-design/Cards/LearningResourceCard",
  argTypes: {
    resource: {
      options: ["Loading", "Without Image", ...Object.values(ResourceTypeEnum)],
      mapping: {
        Loading: undefined,
        "Without Image": makeResource({
          image: null,
        }),
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
    size: {
      options: ["small", "medium"],
      control: { type: "select" },
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
    size,
    onAddToLearningPathClick,
    onAddToUserListClick,
    excerpt,
  }) => {
    const excerptObj = _.pick(resource, excerpt)
    return (
      <Stack direction="row" gap="16px">
        <LearningResourceCardStyled
          resource={resource}
          isLoading={isLoading}
          size={size}
          onAddToLearningPathClick={onAddToLearningPathClick}
          onAddToUserListClick={onAddToUserListClick}
        />
        {excerpt && <pre>{JSON.stringify(excerptObj, null, 2)}</pre>}
      </Stack>
    )
  },
  decorators: [withRouter],
}

export default meta

type Story = StoryObj<StoryProps>

const priceArgs: Partial<Story["args"]> = {
  excerpt: ["certification", "free", "prices"],
}

export const FreeCourseNoCertificate: Story = {
  args: {
    ...priceArgs,
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
    ...priceArgs,
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
    ...priceArgs,
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
    ...priceArgs,
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
    ...priceArgs,
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
    ...priceArgs,
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
    ...priceArgs,
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
    ...priceArgs,
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
    resource: makeResource({ resource_type: ResourceTypeEnum.Podcast }),
    size: "small",
  },
}

export const PodcastEpisode: Story = {
  args: {
    resource: makeResource({ resource_type: ResourceTypeEnum.PodcastEpisode }),
    size: "small",
  },
}

export const Video: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.Video,
      url: "https://www.youtube.com/watch?v=4A9bGL-_ilA",
    }),
    size: "small",
  },
}

export const VideoPlaylist: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.VideoPlaylist,
    }),
    size: "small",
  },
}

export const Loading: Story = {
  args: {
    isLoading: true,
  },
}
