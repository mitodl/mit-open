import React, { useState, useEffect } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Dialog, DialogProps } from "./Dialog"
import Typography from "@mui/material/Typography"

const StateWrapper = (props: DialogProps) => {
  const [open, setOpen] = useState(props.open)

  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const close = () => {
    setOpen(false)
    props.onClose()
  }
  return (
    <Dialog {...props} open={open} onConfirm={close} onClose={close}>
      {props.children}
    </Dialog>
  )
}

const meta: Meta<typeof Dialog> = {
  title: "smoot-design/Dialog",
  component: StateWrapper,
  argTypes: {
    open: {
      control: { type: "boolean" },
    },
    onClose: {
      action: "closed",
    },
    onConfirm: {
      action: "confirmed",
    },
  },
}

export default meta

type Story = StoryObj<typeof Dialog>

export const Content: Story = {
  args: {
    title: "Dialog Title",
    open: true,
  },
  render: (props) => (
    <StateWrapper {...props}>
      <Typography variant="h4">Dialog Content</Typography>
      <Typography variant="body1">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </Typography>
    </StateWrapper>
  ),
}

export const Message: Story = {
  args: {
    title: "Dialog Title",
    message: "Dialog message. Would you like to proceed?",
    open: true,
  },
  render: (props) => <StateWrapper {...props} />,
}
