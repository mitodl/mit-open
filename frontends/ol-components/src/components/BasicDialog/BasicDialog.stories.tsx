import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { BasicDialog } from "./BasicDialog"
import { ThemeProvider } from "ol-components"

const meta: Meta<typeof BasicDialog> = {
  title: "ol-components/BasicDialog",
  render: (props) => (
    <ThemeProvider>
      <BasicDialog {...props}>
        <h1>Dialog Content</h1>
      </BasicDialog>
    </ThemeProvider>
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
