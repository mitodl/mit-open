/* eslint-disable react-hooks/rules-of-hooks */
import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { SelectField } from "./SelectField"
import type { SelectFieldProps } from "./SelectField"
import MenuItem from "@mui/material/MenuItem"

import Stack from "@mui/material/Stack"
import Grid from "@mui/material/Grid"
import { fn } from "@storybook/test"
import { useArgs } from "@storybook/preview-api"

const SIZES = ["medium", "hero"] satisfies SelectFieldProps["size"][]
const meta: Meta<typeof SelectField> = {
  title: "smoot-design/SelectField",
  argTypes: {
    size: {
      options: SIZES,
      control: {
        type: "select",
      },
    },
    value: {
      control: { type: "select" },
      options: ["", "value1", "value2", "value3"],
    },
    onChange: { table: { disable: true } },
    children: { table: { disable: true } },
  },
  args: {
    onChange: fn(),
    placeholder: "placeholder",
    label: "Label",
    helpText: "Help text the quick brown fox jumps over the lazy dog",
    errorText: "Error text the quick brown fox jumps over the lazy dog",
    value: "value1",
    name: "select-example",
    children: [
      <MenuItem key="placeholder" value="" disabled>
        Please select one...
      </MenuItem>,
      <MenuItem key="value1" value="value1">
        Option 1
      </MenuItem>,
      <MenuItem key="value2" value="value2">
        Option 2
      </MenuItem>,
      <MenuItem key="value3" value="value3">
        Option 3
      </MenuItem>,
    ],
  },
}

export default meta

type Story = StoryObj<typeof SelectField>

export const Sizes: Story = {
  render: () => {
    const [args, setArgs] = useArgs<SelectFieldProps>()
    const onChange: SelectFieldProps["onChange"] = (event, node) => {
      setArgs({ value: event.target.value })
      args.onChange?.(event, node)
    }
    return (
      <Stack direction="row" gap={2}>
        <SelectField {...args} onChange={onChange} size="medium" />
        <SelectField {...args} onChange={onChange} size="hero" />
      </Stack>
    )
  },
}

export const States: Story = {
  render: () => {
    const [args, setArgs] = useArgs<SelectFieldProps>()
    const onChange: SelectFieldProps["onChange"] = (event, node) => {
      setArgs({ value: event.target.value })
      args.onChange?.(event, node)
    }
    return (
      <Grid container spacing={2} alignItems="top" maxWidth="400px">
        <Grid item xs={4}>
          Placeholder
        </Grid>
        <Grid item xs={8}>
          <SelectField {...args} value="" />
        </Grid>
        <Grid item xs={4}>
          Default
        </Grid>
        <Grid item xs={8}>
          <SelectField {...args} onChange={onChange} />
        </Grid>
        <Grid item xs={4}>
          Required
        </Grid>
        <Grid item xs={8}>
          <SelectField required {...args} onChange={onChange} />
        </Grid>
        <Grid item xs={4}>
          Error
        </Grid>
        <Grid item xs={8}>
          <SelectField {...args} error onChange={onChange} />
        </Grid>
        <Grid item xs={4}>
          Disabled
        </Grid>
        <Grid item xs={8}>
          <SelectField {...args} onChange={onChange} disabled />
        </Grid>
      </Grid>
    )
  },
  argTypes: {
    placeholder: { table: { disable: true } },
    value: { table: { disable: true } },
    error: { table: { disable: true } },
    disabled: { table: { disable: true } },
  },
}
