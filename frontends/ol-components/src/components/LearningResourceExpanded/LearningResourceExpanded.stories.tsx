import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { LearningResourceExpanded } from "./LearningResourceExpanded"
import { factories } from "api/test-utils"
import { ResourceTypeEnum as LRT } from "api"
import invariant from "tiny-invariant"
import Drawer from "@mui/material/Drawer"
import { BrowserRouter } from "react-router-dom"

const _makeResource = factories.learningResources.resource

const makeResource: typeof _makeResource = (overrides) => {
  const resource = _makeResource(overrides)
  invariant(resource.image)
  resource.image.url =
    "https://ocw.mit.edu/courses/res-hso-001-mit-haystack-observatory-k12-stem-lesson-plans/mitres_hso_001.jpg"
  return resource
}

const meta: Meta<typeof LearningResourceExpanded> = {
  title: "smoot-design/LearningResourceExpanded",
  component: LearningResourceExpanded,
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
        <Drawer open={true} anchor="right">
          <LearningResourceExpanded {...args} />
        </Drawer>
      </BrowserRouter>
    )
  },
}

export default meta

type Story = StoryObj<typeof LearningResourceExpanded>

export const Course: Story = {
  args: {
    resource: makeResource({
      resource_type: LRT.Course,
      runs: [factories.learningResources.run()],
    }),
  },
}

export const CourseMultipleRuns: Story = {
  args: {
    resource: makeResource({
      resource_type: LRT.Course,
      runs: [
        factories.learningResources.run(),
        factories.learningResources.run(),
        factories.learningResources.run(),
      ],
    }),
  },
}

export const LearningPath: Story = {
  args: {
    resource: makeResource({ resource_type: LRT.LearningPath }),
  },
}

export const Program: Story = {
  args: {
    resource: makeResource({ resource_type: LRT.Program }),
  },
}

export const Podcast: Story = {
  args: {
    resource: makeResource({ resource_type: LRT.Podcast }),
  },
}

export const PodcastEpisode: Story = {
  args: {
    resource: makeResource({ resource_type: LRT.PodcastEpisode }),
  },
}

export const Video: Story = {
  args: {
    resource: makeResource({
      resource_type: LRT.Video,
      url: "https://www.youtube.com/watch?v=4A9bGL-_ilA",
    }),
  },
}

export const VideoPlaylist: Story = {
  args: {
    resource: makeResource({
      resource_type: LRT.VideoPlaylist,
    }),
  },
}

export const Loading: Story = {
  args: {
    resource: undefined,
  },
}

export const PricingVariant1: Story = {
  args: {
    resource: makeResource({
      resource_type: LRT.Course,
      title: "The resource is free and offers a paid certificate option",
      prices: ["0", "49"],
      free: true,
      certification: true,
    }),
  },
}

export const PricingVariant2: Story = {
  args: {
    resource: makeResource({
      resource_type: LRT.Course,
      title: "The resource is paid and certificated has a range of prices",
      prices: ["950", "999"],
      free: false,
      certification: true,
    }),
  },
}

export const PricingVariant3a: Story = {
  args: {
    resource: makeResource({
      resource_type: LRT.Course,
      title: "The resource is paid and not certificated has a range of prices",
      prices: ["950", "999"],
      free: false,
      certification: false,
    }),
  },
}

export const PricingVariant3b: Story = {
  args: {
    resource: makeResource({
      resource_type: LRT.Course,
      title: "The resource is paid and not certificated has a range of prices",
      prices: ["950", "999"],
      free: false,
      certification: true,
    }),
  },
}

export const PricingVariant3: Story = {
  args: {
    resource: makeResource({
      resource_type: LRT.Course,
      title:
        "The resource is paid but has a zero price option (prices not ingested correctly)",
      prices: ["0", "999"],
      free: false,
      certification: false,
    }),
  },
}

export const PricingVariant4: Story = {
  args: {
    resource: makeResource({
      resource_type: LRT.Course,
      title: "No prices returned, but free flag is false",
      prices: ["0"],
      free: false,
      certification: false,
    }),
  },
}

export const PricingVariant5: Story = {
  args: {
    resource: makeResource({
      resource_type: LRT.Course,
      title: "Free course, no certificate",
      prices: ["0"],
      free: true,
      certification: false,
    }),
  },
}

export const PricingVariant6: Story = {
  args: {
    resource: makeResource({
      resource_type: LRT.Course,
      title:
        "No free option, price of the certificate is included in the price of the course",
      prices: ["500"],
      free: false,
      certification: false,
    }),
  },
}

export const PricingVariant7: Story = {
  args: {
    resource: makeResource({
      resource_type: LRT.Course,
      title: "No prices, paid",
      prices: [],
      free: false,
      certification: false,
    }),
  },
}

export const PricingVariant8: Story = {
  args: {
    resource: makeResource({
      resource_type: LRT.Course,
      title: "No prices, free",
      prices: [],
      free: false,
      certification: false,
    }),
  },
}
