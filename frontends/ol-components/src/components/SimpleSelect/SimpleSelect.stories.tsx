import React, { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { SimpleSelect, SimpleSelectProps } from "./SimpleSelect"
import type { SimpleSelectOption } from "./SimpleSelect"
import type { SelectChangeEvent } from "@mui/material/Select"

function StateWrapper(props: SimpleSelectProps) {
  const [value, setValue] = useState(props.value)

  const handleChange = (event: SelectChangeEvent<string | string[]>) => {
    setValue(event.target.value)
  }

  return <SimpleSelect {...props} value={value} onChange={handleChange} />
}

const meta: Meta<typeof SimpleSelect> = {
  title: "ol-components/SimpleSelect",
  component: StateWrapper,
  argTypes: {
    multiple: {
      table: {
        disable: true,
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof SimpleSelect>
const options: SimpleSelectOption[] = [
  {
    value: "",
    label: "Please select",
    disabled: true,
  },
  {
    value: "bagel",
    label: "Bagel",
  },
  {
    value: "bacon",
    label: "Bacon",
  },
  {
    value: "french_toast",
    label: "French Toast",
  },
  {
    value: "eggs",
    label: "Eggs",
  },
  {
    value: "belgian_waffles",
    label: "Belgian Waffles",
  },
]

export const SingleSelect: Story = {
  args: {
    value: "",
    multiple: false,
    options: options,
  },
}

export const MultipleSelect: Story = {
  args: {
    value: ["bagel", "bacon"],
    multiple: true,
    options: options,
  },
}
