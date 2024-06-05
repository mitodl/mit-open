import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { LearningResourceCard } from "./LearningResourceCard"
import { ResourceTypeEnum } from "api"
import styled from "@emotion/styled"
import { factories } from "api/test-utils"

const _makeResource = factories.learningResources.resource

const makeResource: typeof _makeResource = (overrides) => {
  const resource = _makeResource(overrides)
  resource.image!.url =
    "https://ocw.mit.edu/courses/res-hso-001-mit-haystack-observatory-k12-stem-lesson-plans/mitres_hso_001.jpg"
  return resource
}

const LearningResourceCardStyled = styled(LearningResourceCard)`
  width: 300px;
`

const meta: Meta<typeof LearningResourceCard> = {
  title: "ol-components/LearningResourceCard",
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
    onActivate,
    onAddToLearningPathClick,
    onAddToUserListClick,
  }) => (
    <LearningResourceCardStyled
      resource={resource}
      isLoading={isLoading}
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
  },
}

export const PodcastEpisode: Story = {
  args: {
    resource: makeResource({ resource_type: ResourceTypeEnum.PodcastEpisode }),
  },
}

export const Video: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.Video,
      url: "https://www.youtube.com/watch?v=4A9bGL-_ilA",
    }),
  },
}

export const VideoPlaylist: Story = {
  args: {
    resource: makeResource({
      resource_type: ResourceTypeEnum.VideoPlaylist,
    }),
  },
}

export const Loading: Story = {
  args: {
    isLoading: true,
  },
}
