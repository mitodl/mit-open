import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { ButtonLink } from "./ButtonLink"
import { withRouter } from "storybook-addon-react-router-v6"

const meta: Meta<typeof ButtonLink> = {
  title: "ol-components/ButtonLink",
  render: (props) => <ButtonLink {...props}>Button Text</ButtonLink>,
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

export const Text: Story = {
  args: {
    to: "#link",
    variant: "text",
    disabled: false,
  },
}

export const Contained: Story = {
  args: {
    to: "#link",
    variant: "contained",
    disabled: false,
  },
}

export const Outlined: Story = {
  args: {
    to: "#link",
    variant: "outlined",
    disabled: false,
  },
}

export const Disabled: Story = {
  args: {
    to: "#link",
    variant: "contained",
    disabled: true,
  },
}
