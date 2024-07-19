import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Dialog } from "./Dialog"
import Typography from "@mui/material/Typography"

const meta: Meta<typeof Dialog> = {
  title: "smoot-design/Dialog",
  render: (props) => (
    <Dialog {...props}>
      <Typography variant="h1">Dialog Content</Typography>
    </Dialog>
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

type Story = StoryObj<typeof Dialog>

const args = {
  title: "Dialog Title",
  open: true,
}

export const Simple: Story = {
  args,
}
