import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import Chip from "@mui/material/Chip"
import Stack from "@mui/material/Stack"
import { fn } from "@storybook/test"
import { ChipLink } from "./ChipLink"
import { withRouter } from "storybook-addon-react-router-v6"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"

const COLORS = ["default", "primary", "secondary"] as const
const VARIANTS = [
  {
    variant: "filled",
    label: "Filled",
  },
  {
    variant: "outlined",
    label: "Outlined",
  },
] as const

const meta: Meta<typeof Chip> = {
  title: 'smoot-design/Chip ("Pill")',
  component: Chip,
  render: (args) => {
    return (
      <Stack gap={1}>
        {VARIANTS.map(({ variant, label }) => (
          <Stack key={variant} direction="row" gap={2}>
            {COLORS.map((color) => (
              <Chip
                key={color}
                variant={variant}
                color={color}
                label={label}
                {...args}
              />
            ))}
          </Stack>
        ))}
        {VARIANTS.map(({ variant, label }) => (
          <Stack key={variant} direction="row" gap={2}>
            {COLORS.map((color) => (
              <Chip
                size="large"
                variant={variant}
                key={color}
                color={color}
                label={label}
                {...args}
              />
            ))}
          </Stack>
        ))}
      </Stack>
    )
  },
}

export default meta

type Story = StoryObj<typeof Chip>

export const Variants: Story = {}

export const Buttons: Story = {
  args: {
    onClick: fn(),
  },
}

export const Deleteable: Story = {
  args: {
    onDelete: fn(),
  },
}

export const Disabled: Story = {
  args: {
    onClick: fn(),
    disabled: true,
  },
}

export const Icons: Story = {
  args: {
    icon: <CalendarTodayIcon />,
  },
}

export const Links: Story = {
  render: () => {
    return (
      <Stack direction="row" gap={2}>
        <ChipLink label="Link" href="" />
        <ChipLink label="Link" color="primary" href="" />
        <ChipLink label="Link" color="secondary" href="" />
      </Stack>
    )
  },
  decorators: [withRouter],
}
