import type { Meta, StoryObj } from "@storybook/react"
import { Banner } from "./Banner"

const lipsum =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista probare, quae sunt a te dicta? Refert tamen, quo modo"

const meta: Meta = {
  title: "smoot-design/Banner",
  component: Banner,
  args: {
    backgroundUrl:
      "https://images.pexels.com/photos/1851188/pexels-photo-1851188.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Banner Title",
    description: lipsum,
    navText: "Home / Nav / Text",
  },
}
export default meta

type Story = StoryObj<typeof Banner>
export const story: Story = {}
