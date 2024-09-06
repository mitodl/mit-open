import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Card } from "./Card"
import { ActionButton } from "../Button/Button"
import { RiMenuAddLine, RiBookmarkLine } from "@remixicon/react"

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
      <Card.Image
        src="/course_image.jpg"
        alt="Provide a meaningful description or leave this blank."
      />
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
          aria-label="First action"
          onClick={() => {}}
        >
          <RiMenuAddLine />
        </ActionButton>
        <ActionButton
          variant="secondary"
          edge="circular"
          color="secondary"
          size="small"
          aria-label="Second action"
          onClick={() => {}}
        >
          <RiBookmarkLine />
        </ActionButton>
      </Card.Actions>
      <Card.Footer>Footer</Card.Footer>
    </Card>
  ),
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
