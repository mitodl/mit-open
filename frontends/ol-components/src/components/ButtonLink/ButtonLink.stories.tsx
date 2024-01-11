import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { ButtonLink } from "./ButtonLink"
import { withRouter } from "storybook-addon-react-router-v6"

const meta: Meta<typeof ButtonLink> = {
  title: "ol-components/ButtonLink",
  decorators: [withRouter],
  argTypes: {
    variant: {
      options: ["text", "contained", "outlined"],
      control: {
        type: "select",
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof ButtonLink>

export const Plain: Story = {
  args: {
    to: "#link",
    variant: "text",
    disabled: false,
    children: "Button Text",
  },
  render: (props) => <ButtonLink {...props}>Plain</ButtonLink>,
}

export const Contained: Story = {
  args: {
    to: "#link",
    variant: "contained",
    disabled: false,
  },
  render: (props) => <ButtonLink {...props}>Contained</ButtonLink>,
}

export const Outlined: Story = {
  args: {
    to: "#link",
    variant: "outlined",
    disabled: false,
  },
  render: (props) => <ButtonLink {...props}>Outlined</ButtonLink>,
}

export const Disabled: Story = {
  args: {
    to: "#link",
    variant: "contained",
    disabled: true,
  },
  render: (props) => <ButtonLink {...props}>Disabled</ButtonLink>,
}
