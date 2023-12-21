import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { FormDialog } from "./FormDialog"

const meta: Meta<typeof FormDialog> = {
  title: "ol-components/FormDialog",
  render: (props) => <FormDialog {...props}>CONTENT</FormDialog>,
  argTypes: {
    onReset: {
      action: "reset",
    },
    onClose: {
      action: "closed",
    },
    onSubmit: {
      action: "submitted",
    },
  },
}

export default meta

type Story = StoryObj<typeof FormDialog>

export const Simple: Story = {
  args: {
    title: "Form Title",
    fullWidth: true,
    open: true,
    footerContent: "Footer content",
    noValidate: false,
  },
}
