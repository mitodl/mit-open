import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { BannerPage } from "./BannerPage"

const meta: Meta<typeof BannerPage> = {
  title: "ol-components/BannerPage",
  render: (props) => (
    <BannerPage {...props}>
      <h1>Page Content</h1>
    </BannerPage>
  ),
}

export default meta

type Story = StoryObj<typeof BannerPage>

const args = {
  className: "",
  src: "/images/course_search_banner.png",
  bannerContent: <h1>Banner Content</h1>,
  bannerContainerClass: "",
  alt: "Banner Alt Text",
  omitBackground: false,
}

export const Simple: Story = {
  args,
}

export const OmitBackground: Story = {
  args: {
    ...args,
    omitBackground: true,
  },
}

// export const Disabled: Story = {
//   args: {
//     label: "Disabled Chip",
//     disabled: true,
//   },
// }
