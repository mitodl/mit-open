import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { LearningResourceCard } from "./LearningResourceCard"
import { ResourceTypeEnum } from "api"
import styled from "@emotion/styled"
import { factories } from "api/test-utils"

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

const meta: Meta<typeof LearningResourceCard> = {
  title: "ol-components/LearningResourceCard",
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
    onActivate: {
      action: "click-activate",
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
    onActivate,
    onAddToLearningPathClick,
    onAddToUserListClick,
  }) => (
    <LearningResourceCardStyled
      resource={resource}
      isLoading={isLoading}
      size={size}
      onActivate={onActivate}
      onAddToLearningPathClick={onAddToLearningPathClick}
      onAddToUserListClick={onAddToUserListClick}
    />
  ),
}

export default meta

type Story = StoryObj<typeof LearningResourceCard>

export const Course: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
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
