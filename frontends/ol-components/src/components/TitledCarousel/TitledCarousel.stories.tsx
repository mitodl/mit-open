import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { TitledCarousel } from "./TitledCarousel"
import styled from "@emotion/styled"
import { theme } from "../ThemeProvider/ThemeProvider"

const Panel = styled.div({
  height: 200,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: theme.palette.primary.main,
  backgroundColor: theme.custom.colorBackground,
  borderRadius: theme.custom.borderRadius,
  borderShadow: theme.custom.shadow,
})

const meta: Meta<typeof TitledCarousel> = {
  title: "ol-components/TitledCarousel",
  render: (props) => (
    <TitledCarousel {...props}>
      <Panel>Child 1</Panel>
      <Panel>Child 2</Panel>
      <Panel>Child 3</Panel>
      <Panel>Child 4</Panel>
      <Panel>Child 5</Panel>
      <Panel>Child 6</Panel>
      <Panel>Child 7</Panel>
      <Panel>Child 8</Panel>
    </TitledCarousel>
  ),
}

export default meta

type Story = StoryObj<typeof TitledCarousel>

export const Simple: Story = {
  args: {
    title: "Carousel Title",
    pageSize: 4,
    previous: <button>Previous</button>,
    next: <button>Next</button>,
    cellSpacing: 20,
  },
}
