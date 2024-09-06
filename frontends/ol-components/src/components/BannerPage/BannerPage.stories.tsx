import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { BannerPage } from "./BannerPage"
import Typography from "@mui/material/Typography"


const meta: Meta<typeof BannerPage> = {
  title: "old/BannerPage",
  render: (props) => (
    <BannerPage {...props}>
      <Typography variant="h1">Page content</Typography>
    </BannerPage>
  ),
}

export default meta

type Story = StoryObj<typeof BannerPage>

const args = {
  className: "",
  src: "/course_search_banner.png",
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
