import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Card } from "./Card"
import { ActionButton } from "../Button/Button"
import { RiMenuAddLine, RiBookmarkLine } from "@remixicon/react"
import { withRouter } from "storybook-addon-react-router-v6"

const meta: Meta<typeof Card> = {
  title: "smoot-design/Cards/Card",
  argTypes: {
    size: {
      options: ["small", "medium"],
      control: { type: "select" },
    },
  },
  render: (args) => (
    <Card {...args}>
      <Card.Image src="https://openlearninglibrary.mit.edu/asset-v1:MITx+11.154x+3T2018+type@asset+block@course_image.jpg" />
      <Card.Info>Info</Card.Info>
      <Card.Title>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit
      </Card.Title>
      <Card.Actions>
        <ActionButton
          variant="secondary"
          edge="circular"
          color="secondary"
          size="small"
          onClick={() => {}}
        >
          <RiMenuAddLine />
        </ActionButton>
        <ActionButton
          variant="secondary"
          edge="circular"
          color="secondary"
          size="small"
          onClick={() => {}}
        >
          <RiBookmarkLine />
        </ActionButton>
      </Card.Actions>
      <Card.Footer>Footer</Card.Footer>
    </Card>
  ),
  decorators: [withRouter],
}

export default meta

type Story = StoryObj<typeof Card>

export const Medium: Story = {
  args: {
    size: "medium",
  },
}

export const Small: Story = {
  args: {
    size: "small",
  },
}

export const NoSize: Story = {
  args: {},
}

export const LinkCard: Story = {
  args: {
    href: "#link",
    size: "medium",
  },
}
