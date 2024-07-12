/* eslint-disable react-hooks/rules-of-hooks */
import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Popover } from "./Popover"
import type { PopoverProps } from "./Popover"
import { Button } from "../Button/Button"
import Typography from "@mui/material/Typography"
import styled from "@emotion/styled"

const ScrollWrapper = styled.div({
  width: "250px",
  height: "250px",
  overflow: "auto",
  border: "1pt solid blue",
})
const Wrapper = styled.div({
  width: "500px",
  height: "500px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  border: "1pt solid red",
})

const StoryPopover = (args: PopoverProps) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  return (
    <Wrapper>
      <Popover
        {...args}
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
      />

      <Button onClick={(event) => setAnchorEl(event.currentTarget)}>
        Open Popover
      </Button>
    </Wrapper>
  )
}

const meta: Meta<typeof Popover> = {
  render: (args) => {
    return <StoryPopover {...args} />
  },
  title: "smoot-design/Popover",
  argTypes: {
    placement: {
      control: { type: "select" },
      options: [undefined, "top", "right", "bottom", "left"],
    },
    modal: {
      control: { type: "select" },
      options: [undefined, false, true],
    },
    children: {
      table: { disable: true },
    },
  },
  args: {
    children: (
      <>
        <Typography variant="h3">Popover Content!</Typography>
        <Button variant="secondary" onClick={console.log}>
          First
        </Button>
        <Button onClick={console.log}>Second</Button>
      </>
    ),
  },
}

export default meta

type Story = StoryObj<typeof Popover>

export const Basic: Story = {}

export const Scrolling: Story = {
  render: (args) => {
    return (
      <ScrollWrapper>
        <StoryPopover {...args} />
      </ScrollWrapper>
    )
  },
}

export const Focus: Story = {
  render: (args) => {
    return (
      <>
        <StoryPopover {...args} />
        <Button variant="secondary">Focus Me</Button>
      </>
    )
  },
}
