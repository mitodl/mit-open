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
    closeable: {
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
    closeable: true,
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
    closeable: {
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
      <Alert {...args} closeable severity="info">
        Closeable alert with severity "info"
      </Alert>
      <Alert {...args} severity="success">
        Alert with severity "success"
      </Alert>
      <Alert {...args} closeable severity="success">
        Closeable alert with severity "success"
      </Alert>
      <Alert {...args} severity="warning">
        Alert with severity "warning"
      </Alert>
      <Alert {...args} closeable severity="warning">
        Closeable alert with severity "warning"
      </Alert>
      <Alert {...args} severity="error">
        Alert with severity "error"
      </Alert>
      <Alert {...args} closeable severity="error">
        Closeable alert with severity "error"
      </Alert>
    </Stack>
  ),
}
