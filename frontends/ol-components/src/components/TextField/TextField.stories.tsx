import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { TextField } from "./TextField"
import type { TextFieldProps } from "./TextField"
import { AdornmentButton } from "../Input/Input"
import Stack from "@mui/material/Stack"
import Grid from "@mui/material/Grid"
import SearchIcon from "@mui/icons-material/Search"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import CloseIcon from "@mui/icons-material/Close"
import { fn } from "@storybook/test"

const SIZES = ["medium", "hero"] satisfies TextFieldProps["size"][]
const ADORNMENTS = {
  None: undefined,
  SearchIcon: (
    <AdornmentButton>
      <SearchIcon />
    </AdornmentButton>
  ),
  CalendarTodayIcon: (
    <AdornmentButton>
      <CalendarTodayIcon />
    </AdornmentButton>
  ),
  CloseIcon: (
    <AdornmentButton>
      <CloseIcon />
    </AdornmentButton>
  ),
  "Close and Calendar": (
    <>
      <AdornmentButton>
        <CloseIcon />
      </AdornmentButton>
      <AdornmentButton>
        <CalendarTodayIcon />
      </AdornmentButton>
    </>
  ),
}

const meta: Meta<typeof TextField> = {
  title: "smoot-design/TextField",
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
  },
  args: {
    onChange: fn(),
    value: "some value",
    placeholder: "placeholder",
    label: "Label",
    helpText: "Help text the quick brown fox jumps over the lazy dog",
    errorText: "Error text the quick brown fox jumps over the lazy dog",
  },
}
export default meta

type Story = StoryObj<typeof TextField>

export const Sizes: Story = {
  render: (args) => {
    return (
      <Stack direction="row" gap={1}>
        <TextField {...args} />
        <TextField {...args} size="hero" />
      </Stack>
    )
  },
  argTypes: { size: { table: { disable: true } } },
}

export const Widths: Story = {
  render: (args) => {
    return (
      <Stack direction="column" gap={1}>
        <TextField {...args} label="default" />
        <TextField {...args} label="fullWidth" fullWidth />
      </Stack>
    )
  },
  argTypes: { fullWidth: { table: { disable: true } } },
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
      <Grid container maxWidth="600px" spacing={2}>
        {Object.values(adornments).flatMap((props, i) =>
          SIZES.map((size) => {
            return (
              <Grid item xs={6} key={`${i}-${size}`}>
                <TextField {...args} size={size} {...props} />
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
      <Grid container spacing={2} alignItems="top" maxWidth="400px">
        <Grid item xs={4}>
          Placeholder
        </Grid>
        <Grid item xs={8}>
          <TextField {...args} value="" />
        </Grid>
        <Grid item xs={4}>
          Default
        </Grid>
        <Grid item xs={8}>
          <TextField {...args} />
        </Grid>
        <Grid item xs={4}>
          Required
        </Grid>
        <Grid item xs={8}>
          <TextField required {...args} />
        </Grid>
        <Grid item xs={4}>
          Error
        </Grid>
        <Grid item xs={8}>
          <TextField {...args} error />
        </Grid>
        <Grid item xs={4}>
          Disabled
        </Grid>
        <Grid item xs={8}>
          <TextField {...args} disabled />
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
