import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { SimpleMenu } from "./SimpleMenu"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"

const meta: Meta<typeof SimpleMenu> = {
  title: "ol-components/SimpleMenu",
  component: SimpleMenu,
  argTypes: {
    onVisibilityChange: {
      action: "changed",
    },
  },
}

export default meta

type Story = StoryObj<typeof SimpleMenu>

export const ReactRouterLinks: Story = {
  args: {
    items: [
      { key: "1", label: "Item 1" },
      { key: "2", label: "Item 2" },
      { key: "3", label: "Item 3" },
    ],
    trigger: <button>Open Menu</button>,
  },
}

export const PlainLinks: Story = {
  args: {
    items: [
      { key: "1", label: "Item 1", LinkComponent: "a" },
      { key: "2", label: "Item 2", LinkComponent: "a" },
      { key: "3", label: "Item 3", LinkComponent: "a" },
    ],
    trigger: <button>Open Menu</button>,
  },
}

export const WithIcons: Story = {
  args: {
    items: [
      { key: "edit", label: "Edit", icon: <EditIcon /> },
      { key: "delete", label: "Delete", icon: <DeleteIcon /> },
    ],
    trigger: <button>Open Menu</button>,
  },
}
