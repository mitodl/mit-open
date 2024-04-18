import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "./Button"
import Grid from "@mui/material/Grid"
import Stack from "@mui/material/Stack"
import { theme } from "../ThemeProvider/ThemeProvider"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import DeleteIcon from "@mui/icons-material/Delete"
import EditIcon from "@mui/icons-material/Edit"
import { withRouter } from "storybook-addon-react-router-v6"

const meta: Meta<typeof Button> = {
  title: "smoot-design/Button",
  component: Button,
  argTypes: {
    children: {
      control: "text",
    },
    variant: {
      options: ["filled", "outlined"],
      control: {
        type: "select",
      },
    },
    size: {
      options: ["small", "medium", "large"],
      control: {
        type: "select",
      },
    },
    color: {
      options: Object.keys(theme.custom.colors),
      control: {
        type: "select",
      },
    },
    disabled: {
      control: "boolean",
    },
  },
}

export default meta

type Story = StoryObj<typeof Button>

export const Plain: Story = {
  args: {
    children: "Hello world",
    variant: "filled",
    size: "large",
  },
}

export const VariantStory: Story = {
  render: () => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <Button variant="filled">Filled</Button>
      <Button variant="outlined">Outlined</Button>
      <Button variant="text">Text</Button>
    </Stack>
  ),
}

export const SizeStory: Story = {
  render: () => (
    <Stack direction="row" gap={2} sx={{ my: 2 }} alignItems="center">
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </Stack>
  ),
}

export const DisabledStory: Story = {
  render: () => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <Button disabled variant="filled">
        Filled
      </Button>
      <Button disabled variant="outlined">
        Outlined
      </Button>
      <Button disabled variant="text">
        Text
      </Button>
    </Stack>
  ),
}

export const ColorStory: Story = {
  render: () => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <Button color="red">Red</Button>
      <Button color="red" variant="outlined">
        Red
      </Button>
      <Button color="blue">Blue</Button>
      <Button color="blue" variant="outlined">
        Blue
      </Button>
    </Stack>
  ),
}

export const EdgeStory: Story = {
  render: () => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <Button edge="sharp">Sharp</Button>
      <Button edge="rounded">Rounded</Button>
      <Button variant="outlined" edge="sharp">
        Sharp
      </Button>
      <Button variant="outlined" edge="rounded">
        Rounded
      </Button>
    </Stack>
  ),
}

export const IconStory: Story = {
  render: () => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <Button startIcon={<ArrowBackIcon />}>Back</Button>
      <Button startIcon={<DeleteIcon />}>Delete</Button>
      <Button startIcon={<EditIcon />}>Edit</Button>
      <Button endIcon={<ArrowForwardIcon />}>Forward</Button>
    </Stack>
  ),
}

const SIZES = ["small", "medium", "large"] as const
const EDGES = ["sharp", "rounded"] as const
const VARIANTS = ["filled", "outlined", "text"] as const
const EXTRA_PROPS = [
  {},
  { startIcon: <ArrowBackIcon /> },
  { endIcon: <ArrowForwardIcon /> },
]

export const LinkStory: Story = {
  decorators: [withRouter],
  render: () => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <Button as="link" href="" variant="filled">
        Link
      </Button>
      <Button as="link" href="" variant="outlined">
        Link
      </Button>
      <Button as="link" href="" variant="text">
        Link
      </Button>
    </Stack>
  ),
}
export const AllStory: Story = {
  render: () => (
    <Grid container rowGap={2} sx={{ maxWidth: "500px" }}>
      {VARIANTS.flatMap((variant) =>
        EDGES.flatMap((edge) =>
          EXTRA_PROPS.map((extraProps, i) => {
            return SIZES.map((size) => (
              <Grid
                item
                xs={4}
                display="flex"
                alignItems="center"
                key={`${variant}-${edge}-${size}-${i}`}
              >
                <Button
                  variant={variant}
                  edge={edge}
                  size={size}
                  {...extraProps}
                >
                  Click me
                </Button>
              </Grid>
            ))
          }),
        ),
      )}
    </Grid>
  ),
}
