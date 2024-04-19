import type { Meta, StoryObj } from "@storybook/react"
import { ChipLink } from "./ChipLink"
import Chip from "@mui/material/Chip"

const meta: Meta<typeof Chip> = {
  title: "smoot-design/Chip",
  component: Chip,
}

export default meta

type Story = StoryObj<typeof ChipLink>

export const Simple: Story = {
  args: {
    label: "Chip Link",
    href: "#link",
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
