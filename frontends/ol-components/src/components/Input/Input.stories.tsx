import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Input, AdornmentButton } from "./Input"
import type { InputProps } from "./Input"
import Stack from "@mui/material/Stack"
import Grid from "@mui/material/Grid"
import { RiCalendarLine, RiCloseLine, RiSearchLine } from "@remixicon/react"
import { fn } from "@storybook/test"

const SIZES = [
  "hero",
  "large",
  "medium",
  "small",
] satisfies InputProps["size"][]
const ADORNMENTS = {
  None: undefined,
  SearchIcon: (
    <AdornmentButton>
      <RiSearchLine />
    </AdornmentButton>
  ),
  CalendarTodayIcon: (
    <AdornmentButton>
      <RiCalendarLine />
    </AdornmentButton>
  ),
  CloseIcon: (
    <AdornmentButton>
      <RiCloseLine />
    </AdornmentButton>
  ),
  "Close and Calendar": (
    <>
      <AdornmentButton>
        <RiCloseLine />
      </AdornmentButton>
      <AdornmentButton>
        <RiCalendarLine />
      </AdornmentButton>
    </>
  ),
}

const meta: Meta<typeof Input> = {
  title: "smoot-design/Input",
  argTypes: {
    size: {
      control: {
        type: "select",
        options: SIZES,
      },
    },
    startAdornment: {
      options: Object.keys(ADORNMENTS),
      mapping: ADORNMENTS,
      control: {
        type: "select",
      },
    },
    endAdornment: {
      options: Object.keys(ADORNMENTS),
      mapping: ADORNMENTS,
      control: {
        type: "select",
      },
    },
    error: {
      control: {
        type: "boolean",
      },
    },
    disabled: {
      control: {
        type: "boolean",
      },
    },
  },
  args: {
    onChange: fn(),
    value: "some value",
    placeholder: "placeholder",
  },
}
export default meta

type Story = StoryObj<typeof Input>

export const Sizes: Story = {
  render: (args) => {
    return (
      <Stack direction="row" gap={1}>
        <Input {...args} size="small" />
        <Input {...args} size="medium" />
        <Input {...args} size="large" />
        <Input {...args} size="hero" />
      </Stack>
    )
  },
  argTypes: { size: { table: { disable: true } } },
}

export const Adornments: Story = {
  render: (args) => {
    const adornments = [
      { startAdornment: ADORNMENTS.SearchIcon },
      { endAdornment: ADORNMENTS.CloseIcon },
      {
        startAdornment: ADORNMENTS.SearchIcon,
        endAdornment: ADORNMENTS["Close and Calendar"],
      },
    ]
    return (
      <Grid container maxWidth="1400px" spacing={2}>
        {Object.values(adornments).flatMap((props, i) =>
          SIZES.map((size) => {
            return (
              <Grid item xs={3} key={`${i}-${size}`}>
                <Input {...args} size={size} {...props} />
              </Grid>
            )
          }),
        )}
      </Grid>
    )
  },
  argTypes: {
    startAdornment: { table: { disable: true } },
    endAdornment: { table: { disable: true } },
  },
}

export const States: Story = {
  render: (args) => {
    return (
      <Grid container spacing={2} alignItems="center" maxWidth="400px">
        <Grid item xs={4}>
          Placeholder
        </Grid>
        <Grid item xs={8}>
          <Input {...args} value="" />
        </Grid>
        <Grid item xs={4}>
          Default
        </Grid>
        <Grid item xs={8}>
          <Input {...args} />
        </Grid>
        <Grid item xs={4}>
          Initially Focused
        </Grid>
        <Grid item xs={8}>
          <Input
            // This is a story just demonstrating the autofocus prop
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            {...args}
          />
        </Grid>
        <Grid item xs={4}>
          Error
        </Grid>
        <Grid item xs={8}>
          <Input {...args} error />
        </Grid>
        <Grid item xs={4}>
          Disabled
        </Grid>
        <Grid item xs={8}>
          <Input {...args} disabled />
        </Grid>
      </Grid>
    )
  },
  args: {
    placeholder: "This is placeholder text.",
    value: "Some value",
  },
  argTypes: {
    placeholder: { table: { disable: true } },
    value: { table: { disable: true } },
    error: { table: { disable: true } },
    disabled: { table: { disable: true } },
  },
}
