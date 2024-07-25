import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import {
  LearningResourceCard,
  LearningResourceCardProps,
} from "./LearningResourceCard"
import { LearningResource } from "api"
import styled from "@emotion/styled"
import { withRouter } from "storybook-addon-react-router-v6"
import Stack from "@mui/system/Stack"
import _ from "lodash"
import { resources, courses, resourceArgType } from "./story_utils"

const LearningResourceCardStyled = styled(LearningResourceCard)`
  width: 300px;
`
type StoryProps = LearningResourceCardProps & {
  excerpt: (keyof LearningResource)[]
}

const meta: Meta<StoryProps> = {
  title: "smoot-design/Cards/LearningResourceCard",
  argTypes: {
    resource: resourceArgType,
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
  render: ({ excerpt, ...args }) => {
    const excerptObj = _.pick(args.resource, excerpt)
    return (
      <Stack direction="row" gap="16px">
        <LearningResourceCardStyled {...args} />
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
    size: "small",
  },
}

export const PodcastEpisode: Story = {
  args: {
    resource: resources.podcastEpisode,
    size: "small",
  },
}

export const Video: Story = {
  args: {
    resource: resources.video,
    size: "small",
  },
}

export const VideoPlaylist: Story = {
  args: {
    resource: resources.videoPlaylist,
    size: "small",
  },
}

export const Loading: Story = {
  args: {
    isLoading: true,
  },
}
