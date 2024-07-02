import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { SimpleMenu } from "./SimpleMenu"
import { RiPencilFill, RiDeleteBin7Fill } from "@remixicon/react"
import { withRouter } from "storybook-addon-react-router-v6"

const meta: Meta<typeof SimpleMenu> = {
  title: "smoot-design/Dropdowns/SimpleMenu",
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
      { key: "1", label: "Item 1", href: "#" },
      { key: "2", label: "Item 2", href: "#" },
      { key: "3", label: "Item 3", href: "#" },
    ],
    trigger: <button>Open Menu</button>,
  },
  decorators: [withRouter],
}

export const PlainLinks: Story = {
  args: {
    items: [
      { key: "1", label: "Item 1", LinkComponent: "a", href: "#" },
      { key: "2", label: "Item 2", LinkComponent: "a", href: "#" },
      { key: "3", label: "Item 3", LinkComponent: "a", href: "#" },
    ],
    trigger: <button>Open Menu</button>,
  },
}

export const WithIcons: Story = {
  args: {
    items: [
      { key: "edit", label: "Edit", icon: <RiPencilFill />, onClick: () => {} },
      {
        key: "delete",
        label: "Delete",
        icon: <RiDeleteBin7Fill />,
        onClick: () => {},
      },
    ],
    trigger: <button>Open Menu</button>,
  },
}
