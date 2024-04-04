import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { ExpandedLearningResourceDisplay } from "./ExpandedLearningResourceDisplay"
import { factories } from "api/test-utils"
import { ResourceTypeEnum as LRT } from "api"
import invariant from "tiny-invariant"
import Drawer from "@mui/material/Drawer"

const _makeResource = factories.learningResources.resource
const makeResource: typeof _makeResource = (overrides) => {
  const resource = _makeResource(overrides)
  invariant(resource.image)
  resource.image.url =
    "https://ocw.mit.edu/courses/res-hso-001-mit-haystack-observatory-k12-stem-lesson-plans/mitres_hso_001.jpg"
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
      <Drawer
        open={true}
        anchor="right"
        PaperProps={{
          sx: { width: "485px", padding: "30px" },
        }}
      >
        <ExpandedLearningResourceDisplay {...args} />
      </Drawer>
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
