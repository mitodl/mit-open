import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Alert } from "./Alert"
import Stack from "@mui/material/Stack"

const meta: Meta<typeof Alert> = {
  title: "smoot-design/Alert",
  component: Alert,
  argTypes: {
    severity: {
      options: ["info", "success", "warning", "error"],
      control: {
        type: "select",
      },
    },
    visible: {
      control: {
        type: "boolean",
      },
    },
    closable: {
      control: {
        type: "boolean",
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof Alert>

export const Basic: Story = {
  args: {
    severity: "info",
  },
  render: (args) => (
    <Alert {...args}>Alert with severity "{args.severity}"</Alert>
  ),
}

export const Closable: Story = {
  args: {
    severity: "warning",
    closable: true,
  },
  render: (args) => (
    <Alert {...args}>Closable alert with severity "{args.severity}"</Alert>
  ),
}

export const Variants: Story = {
  argTypes: {
    severity: {
      table: {
        disable: true,
      },
    },
    closable: {
      table: {
        disable: true,
      },
    },
  },
  render: (args) => (
    <Stack direction="column" gap={2} sx={{ my: 2 }}>
      <Alert {...args} severity="info">
        Alert with severity "info"
      </Alert>
      <Alert {...args} closable severity="info">
        Closable alert with severity "info"
      </Alert>
      <Alert {...args} severity="success">
        Alert with severity "success"
      </Alert>
      <Alert {...args} closable severity="success">
        Closable alert with severity "success"
      </Alert>
      <Alert {...args} severity="warning">
        Alert with severity "warning"
      </Alert>
      <Alert {...args} closable severity="warning">
        Closable alert with severity "warning"
      </Alert>
      <Alert {...args} severity="error">
        Alert with severity "error"
      </Alert>
      <Alert {...args} closable severity="error">
        Closable alert with severity "error"
      </Alert>
    </Stack>
  ),
}
