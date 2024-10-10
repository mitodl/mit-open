import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import Chip from "@mui/material/Chip"
import type { ChipProps } from "@mui/material/Chip"
import Stack from "@mui/material/Stack"

import { fn } from "@storybook/test"
import { ChipLink } from "./ChipLink"
import { withRouter } from "storybook-addon-react-router-v6"
import {
  RiPencilFill,
  RiCalendarLine,
  RiDeleteBin7Fill,
} from "@remixicon/react"

const icons = {
  None: undefined,
  CalendarTodayIcon: <RiCalendarLine />,
  DeleteIcon: <RiDeleteBin7Fill />,
  EditIcon: <RiPencilFill />,
}

const VARIANTS: {
  variant: ChipProps["variant"]
  label: string
}[] = [
  {
    variant: "outlined",
    label: "Outlined",
  },
  {
    variant: "outlinedWhite",
    label: "Outlined White",
  },
  {
    variant: "gray",
    label: "Gray",
  },
  {
    variant: "dark",
    label: "Dark",
  },
  {
    variant: "darker",
    label: "Darker",
  },
  {
    variant: "filled",
    label: "Filled",
  },
] as const

const SIZES = [
  {
    size: "medium",
    label: "Medium",
  },
  {
    size: "large",
    label: "Large",
  },
] as const

const meta: Meta<typeof Chip> = {
  title: 'smoot-design/Chip ("Pill")',
  argTypes: {
    icon: {
      control: { type: "select" },
      options: Object.keys(icons),
      mapping: icons,
    },
    onClick: {
      control: { type: "select" },
      options: ["None", "handler"],
      mapping: { None: undefined, handler: fn() },
    },
    onDelete: {
      control: { type: "select" },
      options: ["None", "handler"],
      mapping: { handler: fn() },
    },
    disabled: {
      control: { type: "boolean" },
    },
  },
  render: (args) => {
    return (
      <Stack gap={1}>
        {VARIANTS.map(({ variant, label }) => (
          <Stack key={variant} direction="row" gap={2}>
            {SIZES.map(({ size }) => (
              <Chip
                {...args}
                key={size}
                variant={variant}
                size={size}
                label={label}
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
    icon: <RiCalendarLine />,
  },
}

type StoryChipLink = StoryObj<typeof ChipLink>
export const Links: StoryChipLink = {
  render: (args) => {
    return (
      <Stack direction="row" gap={2}>
        {VARIANTS.map(({ variant }) => (
          <ChipLink
            {...args}
            key={variant}
            variant={variant}
            label="Link"
            href=""
          />
        ))}
      </Stack>
    )
  },
  decorators: [withRouter],
}
