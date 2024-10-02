import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { withRouter } from "storybook-addon-react-router-v6"
import { Banner } from "./Banner"
import { Breadcrumbs } from "../Breadcrumbs/Breadcrumbs"
import { Button } from "../Button/Button"
import Typography from "@mui/material/Typography"

const lipsum =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista probare, quae sunt a te dicta? Refert tamen, quo modo"

const meta: Meta<typeof Banner> = {
  title: "smoot-design/Banner",
  component: Banner,
  args: {
    backgroundUrl:
      "https://images.pexels.com/photos/1851188/pexels-photo-1851188.jpeg?auto=compress&cs=tinysrgb&w=800",
    navText: (
      <Breadcrumbs
        variant="dark"
        ancestors={[
          { href: "", label: "Home" },
          {
            href: "",
            label: "Nav",
          },
        ]}
        current={"Text"}
      />
    ),
    title: "Banner Title",
    subHeader: lipsum,
  },
}
export default meta

type Story = StoryObj<typeof Banner>

export const basicBanner: Story = {
  decorators: [withRouter],
  render: (args) => <Banner {...args} />,
}

export const logoBanner: Story = {
  decorators: [withRouter],
  render: (args) => {
    return (
      <Banner
        avatar={
          <img
            src="https://learn.mit.edu/static/images/mit-logo-black.svg"
            alt="MIT Logo"
            style={{ height: "37px", filter: "saturate(0%) invert(100%)" }}
          />
        }
        {...args}
      />
    )
  },
}

export const logoBannerWithExtras: Story = {
  decorators: [withRouter],
  render: (args) => {
    return (
      <Banner
        avatar={
          <img
            src="https://learn.mit.edu/static/images/mit-logo-black.svg"
            alt="MIT Logo"
            style={{ height: "37px", filter: "saturate(0%) invert(100%)" }}
          />
        }
        extraHeader={
          <Button variant="primary" color="primary">
            Action Button
          </Button>
        }
        extraRight={
          <div>
            <Typography variant="h4">Extra Content</Typography>
            <div>
              <Button variant="secondary">Secondary Action</Button>
            </div>
            <div>
              <Button variant="tertiary">Tertiary Action</Button>
            </div>
          </div>
        }
        {...args}
      />
    )
  },
}
