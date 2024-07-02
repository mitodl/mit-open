import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { BasicDialog } from "./BasicDialog"
import Typography from "@mui/material/Typography"

const meta: Meta<typeof BasicDialog> = {
  title: "smoot-design/BasicDialog",
  render: (props) => (
    <BasicDialog {...props}>
      <Typography variant="h1">Dialog Content</Typography>
    </BasicDialog>
  ),
  argTypes: {
    onClose: {
      action: "closed",
    },
    onConfirm: {
      action: "confirmed",
    },
  },
}

export default meta

type Story = StoryObj<typeof BasicDialog>

const args = {
  title: "Dialog Title",
  open: true,
}

export const Simple: Story = {
  args,
}
