import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Link } from "./Link"
import styled from "@emotion/styled"
import { withRouter } from "storybook-addon-react-router-v6"

const meta: Meta = {
  title: "smoot-design/Link",
  component: Link,
  decorators: [withRouter],
}
export default meta

const Container = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(3, min-content)",
  alignItems: "baseline",
  gap: "16px",
})

const SIZES = [
  { size: "small", label: "Small" },
  { size: "medium", label: "Medium" },
  { size: "large", label: "Large" },
] as const
const COLORS = [
  { color: "black", label: "Black" },
  { color: "red", label: "Red" },
] as const

type Story = StoryObj<typeof Link>
export const story: Story = {
  render: () => {
    return (
      <Container>
        {COLORS.flatMap(({ color }) =>
          SIZES.map(({ size, label }) => (
            <Link key={`${color}-${size}`} href="" size={size} color={color}>
              {label}
            </Link>
          )),
        )}
      </Container>
    )
  },
}
