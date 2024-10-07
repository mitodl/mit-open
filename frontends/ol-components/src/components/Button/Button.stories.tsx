import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Button, ActionButton, ButtonLink, ActionButtonLink } from "./Button"
import Grid from "@mui/material/Grid"
import Stack from "@mui/material/Stack"
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiDeleteBinLine,
  RiEditLine,
  RiTestTubeLine,
  RiMailLine,
} from "@remixicon/react"

import { fn } from "@storybook/test"
import { capitalize } from "ol-utilities"

const ICONS = {
  None: undefined,
  ArrowForwardIcon: <RiArrowRightLine />,
  ArrowBackIcon: <RiArrowLeftLine />,
  DeleteIcon: <RiDeleteBinLine />,
  EditIcon: <RiEditLine />,
  TestTubeIcon: <RiTestTubeLine />,
  MailIcon: <RiMailLine />,
}

const meta: Meta<typeof Button> = {
  title: "smoot-design/Button",
  component: Button,
  argTypes: {
    variant: {
      options: [
        "primary",
        "secondary",
        "tertiary",
        "text",
        "inverted",
        "text-secondary",
      ],
      control: { type: "select" },
    },
    size: {
      options: ["small", "medium", "large"],
      control: { type: "select" },
    },
    edge: {
      options: ["circular", "rounded"],
      control: { type: "select" },
    },
    startIcon: {
      options: Object.keys(ICONS),
      mapping: ICONS,
    },
    endIcon: {
      options: Object.keys(ICONS),
      mapping: ICONS,
    },
  },
  args: {
    onClick: fn(),
  },
}

export default meta

type Story = StoryObj<typeof Button>

export const Simple: Story = {
  args: {
    variant: "primary",
  },
  render: (args) => <Button {...args}>Button</Button>,
}

export const VariantStory: Story = {
  argTypes: {
    variant: { table: { disable: true } },
  },
  render: (args) => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="tertiary">
        Tertiary
      </Button>
      <Button {...args} variant="text">
        Text
      </Button>
      <Button {...args} variant="noBorder">
        Text Secondary
      </Button>
      <Button {...args} variant="inverted">
        Inverted
      </Button>
    </Stack>
  ),
}

const SIZES = ["small", "medium", "large"] as const
const RESPONSIVE = [true, false]

export const SizeStory: Story = {
  argTypes: {
    size: { table: { disable: true } },
  },
  render: (args) => (
    <Grid container sx={{ my: 2, maxWidth: "600px" }} alignItems="center">
      {RESPONSIVE.flatMap((responsive) => {
        return (
          <React.Fragment key={String(responsive)}>
            <Grid item xs={12}>
              <code>{`responsive={${responsive.toString()}}`}</code>
            </Grid>
            {SIZES.map((size) => (
              <Grid
                item
                xs={4}
                gap={2}
                display="flex"
                alignItems="center"
                key={size}
              >
                <Button {...args} size={size} responsive={responsive}>
                  {capitalize(size)}
                </Button>
              </Grid>
            ))}
          </React.Fragment>
        )
      })}
    </Grid>
  ),
}

export const DisabledStory: Story = {
  argTypes: {
    disabled: { table: { disable: true } },
  },
  render: (args) => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <Button {...args} disabled variant="primary">
        Primary
      </Button>
      <Button {...args} disabled variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="tertiary">
        Tertiary
      </Button>
      <Button {...args} disabled variant="text">
        Text
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
      <Button {...args} edge="circular">
        rounded
      </Button>
      <Button {...args} edge="circular">
        circular
      </Button>
      <Button {...args} variant="secondary" edge="circular">
        rounded
      </Button>
      <Button {...args} variant="secondary" edge="circular">
        circular
      </Button>
      <Button {...args} variant="secondary" edge="none">
        none
      </Button>
    </Stack>
  ),
}

export const WithIconStory: Story = {
  render: (args) => (
    <Stack direction="column" alignItems="start" gap={2} sx={{ my: 2 }}>
      {Object.entries(ICONS).map(([key, icon]) => (
        <Button {...args} startIcon={icon} key={key}>
          {key}
        </Button>
      ))}
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
      <ActionButton {...args} variant="secondary">
        <RiDeleteBinLine />
      </ActionButton>
      <ActionButton {...args} variant="secondary" edge="circular">
        <RiEditLine />
      </ActionButton>
    </Stack>
  ),
}

const EDGES = ["rounded", "circular", "none"] as const

const VARIANTS = ["primary", "secondary", "tertiary", "text"] as const
const EXTRA_PROPS = [
  {},
  /**
   * Show RiTestTubeLine because it is a fairly thin icon
   */
  { startIcon: <RiTestTubeLine /> },
  /**
   * Show RiTestTubeLine because it is a fairly thick icon
   */
  { startIcon: <RiMailLine /> },
  { endIcon: <RiTestTubeLine /> },
  { endIcon: <RiMailLine /> },
]

export const LinkStory: Story = {
  render: () => (
    <Stack direction="row" gap={2} sx={{ my: 2 }}>
      <ButtonLink href="#fake" variant="primary">
        Link
      </ButtonLink>
      <ButtonLink href="#fake" variant="secondary">
        Link
      </ButtonLink>
      <ButtonLink href="#fake" variant="text">
        Link
      </ButtonLink>
    </Stack>
  ),
}
export const ButtonsShowcase: Story = {
  render: (args) => (
    <Grid container rowGap={2} sx={{ maxWidth: "600px" }}>
      {VARIANTS.flatMap((variant) =>
        EDGES.flatMap((edge) =>
          EXTRA_PROPS.map((extraProps, i) => {
            return (
              <React.Fragment key={`${variant}-${edge}-${i}`}>
                <Grid xs={3}>
                  <pre>
                    variant={variant}
                    <br />
                    edge={edge}
                  </pre>
                </Grid>
                {SIZES.map((size) => (
                  <Grid
                    item
                    xs={3}
                    display="flex"
                    alignItems="center"
                    key={`${size}`}
                  >
                    <Button
                      {...args}
                      variant={variant}
                      edge={edge}
                      size={size}
                      {...extraProps}
                    >
                      {args.children}
                    </Button>
                  </Grid>
                ))}
              </React.Fragment>
            )
          }),
        ),
      )}
    </Grid>
  ),
  args: {
    children: "Click me",
  },
}

export const WrappingButtonShowcase: Story = {
  ...ButtonsShowcase,
  args: {
    children: (
      <>
        The quick <br /> fox
      </>
    ),
  },
}

export const ActionButtonsShowcase: Story = {
  render: (args) => (
    <>
      {VARIANTS.flatMap((variant) =>
        EDGES.flatMap((edge) => (
          <Stack
            direction="row"
            gap={2}
            key={`${variant}-${edge}`}
            alignItems="center"
            sx={{ my: 2 }}
          >
            <pre>
              variant={variant}
              <br />
              edge={edge}
            </pre>
            {SIZES.map((size) => (
              <React.Fragment key={size}>
                {Object.entries(ICONS)
                  .filter(([_key, icon]) => icon)
                  .map(([key, icon]) => (
                    <ActionButton
                      key={key}
                      variant={variant}
                      edge={edge}
                      size={size}
                      {...args}
                    >
                      {icon}
                    </ActionButton>
                  ))}
              </React.Fragment>
            ))}
          </Stack>
        )),
      )}
    </>
  ),
}

export const ActionButtonLinkShowcase: StoryObj<typeof ActionButtonLink> = {
  render: (args) => (
    <>
      {VARIANTS.flatMap((variant) =>
        EDGES.flatMap((edge) => (
          <Stack
            direction="row"
            gap={2}
            key={`${variant}-${edge}`}
            alignItems="center"
            sx={{ my: 2 }}
          >
            <pre>
              variant={variant}
              <br />
              edge={edge}
            </pre>
            {SIZES.map((size) => (
              <React.Fragment key={size}>
                {Object.entries(ICONS)
                  .filter(([_key, icon]) => icon)
                  .map(([key, icon]) => (
                    <ActionButtonLink
                      key={key}
                      variant={variant}
                      edge={edge}
                      size={size}
                      {...args}
                      href="#fake"
                    >
                      {icon}
                    </ActionButtonLink>
                  ))}
              </React.Fragment>
            ))}
          </Stack>
        )),
      )}
    </>
  ),
}

export const ActionButtonSizeStory: Story = {
  argTypes: {
    size: { table: { disable: true } },
  },
  render: (args) => (
    <Grid container sx={{ my: 2, maxWidth: "600px" }} alignItems="center">
      {RESPONSIVE.flatMap((responsive) => {
        return (
          <React.Fragment key={String(responsive)}>
            <Grid item xs={12}>
              <code>{`responsive={${responsive.toString()}}`}</code>
            </Grid>
            {SIZES.map((size) => (
              <Grid
                item
                xs={4}
                gap={2}
                display="flex"
                alignItems="center"
                key={size}
              >
                <ActionButton {...args} size={size} responsive={responsive}>
                  <RiDeleteBinLine />
                </ActionButton>
              </Grid>
            ))}
          </React.Fragment>
        )
      })}
    </Grid>
  ),
}
