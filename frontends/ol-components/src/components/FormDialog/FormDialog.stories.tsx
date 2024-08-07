import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { FormDialog, FormDialogProps } from "./FormDialog"
import { TextField } from "../TextField/TextField"
import MuiButton from "@mui/material/Button"
import { action } from "@storybook/addon-actions"

const DialogDemo = (props: FormDialogProps) => {
  const [open, setOpen] = React.useState(false)

  const handleClickOpen = () => setOpen(true)

  const handleClose = () => setOpen(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    action("submitted")(event)
    setOpen(false)
  }

  return (
    <div>
      <MuiButton variant="outlined" onClick={handleClickOpen}>
        Open dialog
      </MuiButton>
      <FormDialog
        {...props}
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmit}
      >
        <TextField
          name="a"
          label="Field A"
          placeholder="A text field"
          fullWidth
        />
        <TextField
          name="b"
          label="Field B"
          placeholder="A multiline text field"
          fullWidth
          multiline
          minRows={3}
        />
      </FormDialog>
    </div>
  )
}

const meta: Meta<typeof FormDialog> = {
  title: "smoot-design/FormDialog",
  component: DialogDemo,
  argTypes: {
    onReset: {
      action: "reset",
    },
    onClose: {
      action: "closed",
    },
    onSubmit: {
      action: "submitted",
    },
  },
}

export default meta

type Story = StoryObj<typeof FormDialog>

export const Simple: Story = {
  args: {
    title: "Form Title",
    fullWidth: true,
    footerContent: "Footer content",
  },
}
