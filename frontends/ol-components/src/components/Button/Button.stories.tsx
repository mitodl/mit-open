import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Button, ActionButton, ButtonLink } from "./Button"
import Grid from "@mui/material/Grid"
import Stack from "@mui/material/Stack"
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiDeleteBinLine,
  RiEditLine,
} from "@remixicon/react"

import { withRouter } from "storybook-addon-react-router-v6"
import { fn } from "@storybook/test"

const icons = {
  None: undefined,
  ArrowForwardIcon: <RiArrowRightLine />,
  ArrowBackIcon: <RiArrowLeftLine />,
  DeleteIcon: <RiDeleteBinLine />,
  EditIcon: <RiEditLine />,
}

const meta: Meta<typeof Button> = {
  title: "smoot-design/Button",
  component: Button,
  argTypes: {
    startIcon: {
      options: Object.keys(icons),
      mapping: icons,
    },
    endIcon: {
      options: Object.keys(icons),
      mapping: icons,
    },
  },
  args: {
    onClick: fn(),
  },
}

export default meta

type Story = StoryObj<typeof Button>

export const VariantStory: Story = {
  argTypes: {
    variant: { table: { disable: true } },
  },
  render: (args) => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <Button {...args} variant="filled">
        Filled
      </Button>
      <Button {...args} variant="outlined">
        Outlined
      </Button>
      <Button {...args} variant="text">
        Text
      </Button>
    </Stack>
  ),
}

export const SizeStory: Story = {
  argTypes: {
    size: { table: { disable: true } },
  },
  render: (args) => (
    <Stack direction="row" gap={2} sx={{ my: 2 }} alignItems="center">
      <Button {...args} size="small">
        Small
      </Button>
      <Button {...args} size="medium">
        Medium
      </Button>
      <Button {...args} size="large">
        Large
      </Button>
    </Stack>
  ),
}

export const DisabledStory: Story = {
  argTypes: {
    disabled: { table: { disable: true } },
  },
  render: (args) => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <Button {...args} disabled variant="filled">
        Filled
      </Button>
      <Button {...args} disabled variant="outlined">
        Outlined
      </Button>
      <Button {...args} disabled variant="text">
        Text
      </Button>
    </Stack>
  ),
}

export const ColorStory: Story = {
  argTypes: {
    color: { table: { disable: true } },
  },
  render: (args) => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <Button {...args} color="primary">
        Primary
      </Button>
      <Button {...args} color="primary" variant="outlined">
        Primary
      </Button>
      <Button {...args} color="secondary">
        Secondary
      </Button>
      <Button {...args} color="secondary" variant="outlined">
        Secondary
      </Button>
    </Stack>
  ),
}

export const EdgeStory: Story = {
  argTypes: {
    edge: { table: { disable: true } },
  },
  render: (args) => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <Button {...args} edge="sharp">
        Sharp
      </Button>
      <Button {...args} edge="rounded">
        Rounded
      </Button>
      <Button {...args} variant="outlined" edge="sharp">
        Sharp
      </Button>
      <Button {...args} variant="outlined" edge="rounded">
        Rounded
      </Button>
    </Stack>
  ),
}

export const WithIconStory: Story = {
  render: (args) => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <Button {...args} startIcon={<RiArrowLeftLine />}>
        Back
      </Button>
      <Button {...args} startIcon={<RiDeleteBinLine />}>
        Delete
      </Button>
      <Button {...args} startIcon={<RiEditLine />}>
        Edit
      </Button>
      <Button {...args} endIcon={<RiArrowRightLine />}>
        Forward
      </Button>
    </Stack>
  ),
}

export const IconOnlyStory: Story = {
  render: (args) => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <ActionButton {...args}>
        <RiArrowLeftLine />
      </ActionButton>
      <ActionButton {...args}>
        <RiArrowRightLine />
      </ActionButton>
      <ActionButton {...args} variant="outlined">
        <RiDeleteBinLine />
      </ActionButton>
      <ActionButton {...args} variant="outlined" edge="rounded">
        <RiEditLine />
      </ActionButton>
    </Stack>
  ),
}

const SIZES = ["small", "medium", "large"] as const
const EDGES = ["sharp", "rounded"] as const
const VARIANTS = ["filled", "outlined", "text"] as const
const EXTRA_PROPS = [
  {},
  { startIcon: <RiArrowLeftLine /> },
  { endIcon: <RiArrowRightLine /> },
]

export const LinkStory: Story = {
  decorators: [withRouter],
  render: () => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <ButtonLink href="" variant="filled">
        Link
      </ButtonLink>
      <ButtonLink href="" variant="outlined">
        Link
      </ButtonLink>
      <ButtonLink href="" variant="text">
        Link
      </ButtonLink>
    </Stack>
  ),
}
export const ButtonsShowcase: Story = {
  render: (args) => (
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
                  {...args}
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

const COLORS = ["primary", "secondary"] as const
const ICONS = [
  {
    component: <RiArrowLeftLine />,
    key: "back",
  },
  {
    component: <RiDeleteBinLine />,
    key: "delete",
  },
  {
    component: <RiEditLine />,
    key: "edit",
  },
  {
    component: <RiArrowRightLine />,
    key: "forward",
  },
]
export const ActionButtonsShowcase: Story = {
  render: () => (
    <>
      {VARIANTS.flatMap((variant) =>
        EDGES.flatMap((edge) =>
          COLORS.flatMap((color) => (
            <Stack
              direction="row"
              gap={2}
              key={`${variant}-${edge}-${color}`}
              alignItems="center"
              sx={{ my: 2 }}
            >
              {SIZES.map((size) => (
                <React.Fragment key={size}>
                  {ICONS.map((icon) => (
                    <ActionButton
                      key={icon.key}
                      variant={variant}
                      edge={edge}
                      size={size}
                      color={color}
                    >
                      {icon.component}
                    </ActionButton>
                  ))}
                </React.Fragment>
              ))}
            </Stack>
          )),
        ),
      )}
    </>
  ),
}
