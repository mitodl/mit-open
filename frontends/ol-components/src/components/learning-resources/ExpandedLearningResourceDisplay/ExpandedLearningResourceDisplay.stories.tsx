import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { ExpandedLearningResourceDisplay } from "./ExpandedLearningResourceDisplay"
import { factories } from "api/test-utils"
import { ResourceTypeEnum as LRT } from "api"
import invariant from "tiny-invariant"
import { Drawer } from "ol-components"
import { BrowserRouter } from "react-router-dom"

const _makeResource = factories.learningResources.resource

const makeResource: typeof _makeResource = (overrides) => {
  const resource = _makeResource(overrides)
  invariant(resource.image)
  resource.image.url =
    "https://prolearn.mit.edu/sites/default/files/images/GSAHC.jpg"
  return resource
}

const meta: Meta<typeof ExpandedLearningResourceDisplay> = {
  title: "ol-components/ExpandedLearningResourceDisplay",
  component: ExpandedLearningResourceDisplay,
  args: {
    imgConfig: {
      key: process.env.EMBEDLY_KEY!,
      width: 385,
      height: 200,
    },
  },
  argTypes: {
    resource: {
      options: ["Loading", ...Object.values(LRT)],
      mapping: {
        Loading: undefined,
        [LRT.Course]: makeResource({ resource_type: LRT.Course }),
        [LRT.Program]: makeResource({ resource_type: LRT.Program }),
        [LRT.Video]: makeResource({
          resource_type: LRT.Video,
          url: "https://www.youtube.com/watch?v=-E9hf5RShzQ",
        }),
        [LRT.VideoPlaylist]: makeResource({
          resource_type: LRT.VideoPlaylist,
        }),
        [LRT.Podcast]: makeResource({ resource_type: LRT.Podcast }),
        [LRT.PodcastEpisode]: makeResource({
          resource_type: LRT.PodcastEpisode,
        }),
        [LRT.LearningPath]: makeResource({
          resource_type: LRT.LearningPath,
        }),
      },
    },
  },
  render: (args) => {
    return (
      <BrowserRouter>
        <Drawer
          open={true}
          anchor="right"
          PaperProps={{
            sx: { width: "485px" },
          }}
        >
          <ExpandedLearningResourceDisplay {...args} />
        </Drawer>
      </BrowserRouter>
    )
  },
}

export default meta

type Story = StoryObj<typeof ExpandedLearningResourceDisplay>

export const Course: Story = {
  args: {
    resource: makeResource({ resource_type: LRT.Course }),
  },
}

export const Program: Story = {
  args: {
    resource: makeResource({ resource_type: LRT.Program }),
  },
}

export const Video: Story = {
  args: {
    resource: makeResource({ resource_type: LRT.Video }),
  },
}
