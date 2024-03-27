import type { Meta, StoryObj } from "@storybook/react"
import { ExpandedLearningResourceDisplay } from "./ExpandedLearningResourceDisplay"
import { factories } from "api/test-utils"
import { ResourceTypeEnum as LRT } from "api"

const makeResource = factories.learningResources.resource

const meta: Meta<typeof ExpandedLearningResourceDisplay> = {
  title: "ol-components/ExpandedLearningResourceDisplay",
  component: ExpandedLearningResourceDisplay,
  argTypes: {
    resource: {
      options: Object.values(LRT),
      mapping: {
        [LRT.Course]: makeResource({ resource_type: LRT.Course }),
        [LRT.Program]: makeResource({ resource_type: LRT.Program }),
        [LRT.Video]: makeResource({ resource_type: LRT.Video }),
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
}

export default meta

type Story = StoryObj<typeof ExpandedLearningResourceDisplay>

export const Course: Story = {
  args: {
    resource: makeResource({ resource_type: LRT.Course }),
  },
}
