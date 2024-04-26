import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Carousel } from "./Carousel"
import styled from "@emotion/styled"
import { theme } from "../ThemeProvider/ThemeProvider"

const Panel = styled.div({
  height: 200,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: theme.palette.primary.main,
  backgroundColor: theme.palette.grey[300],
  borderShadow: theme.custom.shadow,
})

const meta: Meta<typeof Carousel> = {
  title: "ol-components/Carousel",
  render: (props) => (
    <div>
      <p style={{ backgroundColor: "lightblue" }}>
        With respect to this blue rectangle, the left-most child is
        left-aligned, the right-most child is right-aligned.
      </p>
      <Carousel {...props}>
        <Panel>Child 1</Panel>
        <Panel>Child 2</Panel>
        <Panel>Child 3</Panel>
        <Panel>Child 4</Panel>
        <Panel>Child 5</Panel>
        <Panel>Child 6</Panel>
        <Panel>Child 7</Panel>
        <Panel>Child 8</Panel>
      </Carousel>
    </div>
  ),
}

export default meta

type Story = StoryObj<typeof Carousel>

export const Simple: Story = {
  args: {
    pageSize: 4,
    cellSpacing: 20,
  },
}
