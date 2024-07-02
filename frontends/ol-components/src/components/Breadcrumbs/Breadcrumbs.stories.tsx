import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Breadcrumbs, BreadcrumbsProps } from "./Breadcrumbs"
import { withRouter } from "storybook-addon-react-router-v6"
import styled from "@emotion/styled"

const meta: Meta<typeof Breadcrumbs> = {
  title: "smoot-design/Breadcrumbs",
  component: Breadcrumbs,
  decorators: [withRouter],
}
export default meta

const Container = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(2, min-content)",
  alignItems: "baseline",
  gap: "16px",
})

const VARIANTS = ["light", "dark"]

type Story = StoryObj<typeof Breadcrumbs>
export const story: Story = {
  render: () => {
    return (
      <>
        {VARIANTS.map((variant) => (
          <Container
            key={variant}
            style={
              variant === "light"
                ? { background: "white" }
                : { background: "black" }
            }
          >
            <Breadcrumbs
              variant={variant as BreadcrumbsProps["variant"]}
              ancestors={[
                { href: "", label: "Home" },
                { href: "", label: "Grandparent" },
                { href: "", label: "Parent" },
              ]}
              current="Current"
            />
          </Container>
        ))}
      </>
    )
  },
}
