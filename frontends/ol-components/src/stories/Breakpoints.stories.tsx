import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import Container from "@mui/material/Container"
import styled from "@emotion/styled"

const Background = styled.div`
  background-color: #f3ddce;
`
const Content = styled.div`
  background-color: #b1dcea;
  border: 1px solid black;
  height: 100px;
`

const BreakpointsDemo = () => {
  return (
    <Background>
      <Container>
        <Content>Breakpoints</Content>
      </Container>
    </Background>
  )
}

const meta: Meta<typeof BreakpointsDemo> = {
  title: "smoot-design/Container Breakpoints",
  component: BreakpointsDemo,
  parameters: {
    viewports: {},
  },
}

export default meta

type Story = StoryObj<typeof BreakpointsDemo>

export const Basic: Story = {}
