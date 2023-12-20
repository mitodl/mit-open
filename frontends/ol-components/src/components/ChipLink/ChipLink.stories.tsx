import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { ChipLink } from "./ChipLink"
import { withRouter } from "storybook-addon-react-router-v6"

const meta: Meta<typeof ChipLink> = {
  title: "ol-components/ChipLink",
  render: (props) => <ChipLink {...props} />,
  decorators: [withRouter],
}

export default meta

type Story = StoryObj<typeof ChipLink>

export const Simple: Story = {
  args: {
    label: "Chip Link",
    to: "#link",
  },
}

export const Secondary: Story = {
  args: {
    label: "Secondary Chip Link",
    color: "secondary",
  },
}

export const Disabled: Story = {
  args: {
    label: "Disabled Chip Link",
    disabled: true,
  },
}
