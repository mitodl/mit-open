import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { ShareTooltip } from "./ShareTooltip"

const meta: Meta<typeof ShareTooltip> = {
  title: "old/ShareTooltip",
  component: ShareTooltip,
}

export default meta

type Story = StoryObj<typeof ShareTooltip>

export const Simple: Story = {
  args: {
    url: window.location.href,
    hideSocialButtons: false,
    placement: "left",
    objectType: "page",
    children: <button>Share</button>,
  },
}
