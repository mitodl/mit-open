import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import {
  LearningResourceListCardCondensed,
  LearningResourceListCardCondensedProps,
} from "./LearningResourceListCardCondensed"
import { LearningResource } from "api"
import { withRouter } from "storybook-addon-react-router-v6"
import _ from "lodash"
import Stack from "@mui/system/Stack"
import { resourceArgType, resources, courses } from "./story_utils"

type StoryProps = LearningResourceListCardCondensedProps & {
  excerpt: (keyof LearningResource)[]
}

const meta: Meta<StoryProps> = {
  title: "smoot-design/Cards/LearningResourceListCardCondensed",
  argTypes: {
    resource: resourceArgType,
    onAddToLearningPathClick: {
      action: "click-add-to-learning-path",
    },
    onAddToUserListClick: {
      action: "click-add-to-user-list",
    },
  },
  render: ({ excerpt, ...args }) => {
    const excerptObj = _.pick(args.resource, excerpt)
    return (
      <Stack gap="16px">
        <LearningResourceListCardCondensed
          {...args}
          href={`?resource=${args.resource?.id}`}
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
    resource: courses.free.noCertificate,
  },
}

export const FreeCourseWithCertificateOnePrice: Story = {
  args: {
    ...priceArgs,
    resource: courses.free.withCertificateOnePrice,
  },
}

export const FreeCourseWithCertificatePriceRange: Story = {
  args: {
    ...priceArgs,
    resource: courses.free.withCertificatePriceRange,
  },
}

export const UnknownPriceCourseWithoutCertificate: Story = {
  args: {
    ...priceArgs,
    resource: courses.unknownPrice.noCertificate,
  },
}

export const UnknownPriceCourseWithCertificate: Story = {
  args: {
    ...priceArgs,
    resource: courses.unknownPrice.withCertificate,
  },
}

export const PaidCourseWithoutCertificate: Story = {
  args: {
    ...priceArgs,
    resource: courses.paid.withoutCertificate,
  },
}

export const PaidCourseWithCertificateOnePrice: Story = {
  args: {
    ...priceArgs,
    resource: courses.paid.withCerticateOnePrice,
  },
}

export const PaidCourseWithCertificatePriceRange: Story = {
  args: {
    ...priceArgs,
    resource: courses.paid.withCertificatePriceRange,
  },
}

export const LearningPath: Story = {
  args: {
    resource: resources.learningPath,
  },
}

export const Program: Story = {
  args: {
    resource: resources.program,
  },
}

export const Podcast: Story = {
  args: {
    resource: resources.podcast,
  },
}

export const PodcastEpisode: Story = {
  args: {
    resource: resources.podcastEpisode,
  },
}

export const Video: Story = {
  args: {
    resource: resources.video,
  },
}

export const VideoPlaylist: Story = {
  args: {
    resource: resources.videoPlaylist,
  },
}

export const Loading: Story = {
  args: {
    isLoading: true,
  },
}

export const Draggable: Story = {
  args: {
    resource: resources.course,
    draggable: true,
  },
}
