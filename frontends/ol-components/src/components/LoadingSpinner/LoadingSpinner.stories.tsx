import type { Meta, StoryObj } from "@storybook/react"
import { LoadingSpinner } from "./LoadingSpinner"

const meta: Meta<typeof LoadingSpinner> = {
  title: "smoot-design/LoadingSpinner",
  component: LoadingSpinner,
}

export default meta

type Story = StoryObj<typeof LoadingSpinner>

export const Loading: Story = {
  args: {
    loading: true,
  },
}

export const Loaded: Story = {
  args: {
    loading: false,
  },
}
