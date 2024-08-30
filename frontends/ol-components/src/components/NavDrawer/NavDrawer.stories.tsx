import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { NavData, NavDrawer } from "./NavDrawer"
import MuiButton from "@mui/material/Button"
import styled from "@emotion/styled"
import { useToggle } from "ol-utilities"

const NavDrawerDemo = () => {
  const [open, setOpen] = useToggle(false)

  const handleClickOpen = () => setOpen(!open)

  const navData: NavData = {
    sections: [
      {
        title: "TEST",
        items: [
          {
            title: "Link and description",
            description: "This item has a link and a description",
            href: "https://mit.edu",
          },
          {
            title: "Link but no description",
            href: "https://ocw.mit.edu",
          },
        ],
      },
    ],
  }

  const StyledButton = styled(MuiButton)({
    position: "absolute",
    right: "20px",
  })

  return (
    <div>
      <StyledButton variant="outlined" onClick={handleClickOpen}>
        Toggle drawer
      </StyledButton>
      <NavDrawer navdata={navData} open={open} onClose={setOpen.off} />
    </div>
  )
}

const meta: Meta<typeof NavDrawer> = {
  title: "smoot-design/NavDrawer",
  component: NavDrawerDemo,
  argTypes: {
    onReset: {
      action: "reset",
    },
    onClose: {
      action: "closed",
    },
  },
}

export default meta

type Story = StoryObj<typeof NavDrawer>

export const Simple: Story = {
  args: {
    title: "Simple",
  },
}
