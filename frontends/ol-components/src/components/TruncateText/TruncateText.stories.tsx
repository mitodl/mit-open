import type { Meta, StoryObj } from "@storybook/react"
import { TruncateText } from "./TruncateText"

const meta: Meta<typeof TruncateText> = {
  title: "smoot-design/TruncateText",
  component: TruncateText,
  argTypes: {
    lineClamp: {
      options: ["none", 1, 2, 3, 4, 5],
      control: {
        type: "select",
      },
    },
  },
  args: {
    lineClamp: 1,
    children:
      "This is a long text that should be truncated after a few lines. ".repeat(
        30,
      ),
  },
}

export default meta

type Story = StoryObj<typeof TruncateText>

export const None: Story = {
  args: {
    lineClamp: "none",
  },
}
export const One: Story = {
  args: {
    lineClamp: 1,
  },
}
export const Three: Story = {
  args: {
    lineClamp: 3,
  },
}
