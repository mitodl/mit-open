import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Carousel } from "./Carousel"
import styled from "@emotion/styled"
import { theme } from "../ThemeProvider/ThemeProvider"

const Panel = styled.div({
  height: 200,
  width: 300,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: theme.palette.primary.main,
  backgroundColor: theme.palette.grey[300],
  borderShadow: theme.custom.shadow,
})
const Slide: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Panel>{children}</Panel>
}

const StyledCarousel = styled(Carousel)({
  ".slick-track": {
    display: "flex",
    gap: "24px",
  },
})

const meta: Meta<typeof Carousel> = {
  title: "ol-components/Carousel",
  render: (props) => (
    <div>
      This carousel:
      <ul>
        <li>Has 10 slides</li>
        <li>has pagesize equal to number of fully visible slides</li>
        <li>should have next/prev disabled at beginning/end</li>
      </ul>
      <StyledCarousel {...props}>
        {[...Array(10)].map((_, i) => (
          <Slide key={i}>Slide {i}</Slide>
        ))}
      </StyledCarousel>
    </div>
  ),
}

export default meta

type Story = StoryObj<typeof Carousel>

export const Simple: Story = {
  args: {},
}
