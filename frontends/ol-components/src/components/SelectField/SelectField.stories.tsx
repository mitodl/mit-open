/* eslint-disable react-hooks/rules-of-hooks */
import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { SelectField } from "./SelectField"
import type { SelectFieldProps } from "./SelectField"
import { MenuItem } from "../MenuItem/MenuItem"

import Stack from "@mui/material/Stack"
import Grid from "@mui/material/Grid"
import { fn } from "@storybook/test"

const SIZES = ["small", "medium", "large"] satisfies SelectFieldProps["size"][]
const meta: Meta<typeof SelectField> = {
  title: "smoot-design/Dropdowns/SelectField (low-level)",
  argTypes: {
    size: {
      options: SIZES,
      control: {
        type: "select",
      },
    },
    onChange: { table: { disable: true } },
  },
  args: {
    onChange: fn(),
    placeholder: "placeholder",
    label: "Label",
    helpText: "Help text the quick brown fox jumps over the lazy dog",
    errorText: "Error text the quick brown fox jumps over the lazy dog",
    name: "select-example",
  },
}

export default meta

const ITEMS = [
  { label: "Please select one...", props: { value: "", disabled: true } },
  { label: "Option 1", props: { value: "value1" } },
  { label: "Option 2", props: { value: "value2" } },
  { label: "Option 3", props: { value: "value3" } },
]

type Story = StoryObj<typeof SelectField>

export const Sizes: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("")
    const onChange: SelectFieldProps["onChange"] = (event, node) => {
      setValue(event.target.value as string)
      args.onChange?.(event, node)
    }
    const props = { ...args, value, onChange }
    return (
      <Stack direction="column" gap={2}>
        {SIZES.map((size) => (
          <SelectField key={size} {...props} size={size}>
            {ITEMS.map((item) => (
              <MenuItem key={item.props.value} {...item.props} size={size}>
                {item.label}
              </MenuItem>
            ))}
          </SelectField>
        ))}
      </Stack>
    )
  },
}

const STATES = [
  { label: "Placeholder", extraProps: { value: "" } },
  { label: "Default", extraProps: {} },
  { label: "Required", extraProps: { required: true } },
  { label: "Error", extraProps: { error: true } },
  { label: "Disabled", extraProps: { disabled: true } },
]
export const States: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("")
    const onChange: SelectFieldProps["onChange"] = (event, node) => {
      setValue(event.target.value as string)
      args.onChange?.(event, node)
    }
    const props = {
      ...args,
      value,
      onChange,
    }
    return (
      <Grid container spacing={2} alignItems="top" maxWidth="400px">
        {STATES.map(({ label, extraProps }) => (
          <>
            <Grid item xs={4}>
              {label}
            </Grid>
            <Grid item xs={8}>
              <SelectField {...props} {...extraProps}>
                {ITEMS.map((item) => (
                  <MenuItem
                    key={item.props.value}
                    {...item.props}
                    size={args.size}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </SelectField>
            </Grid>
          </>
        ))}
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
