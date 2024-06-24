import React, { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { SimpleSelect, SimpleSelectProps } from "./SimpleSelect"
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
const options = [
  {
    key: "bagel",
    label: "Bagel",
  },
  {
    key: "bacon",
    label: "Bacon",
  },
  {
    key: "french_toast",
    label: "French Toast",
  },
  {
    key: "eggs",
    label: "Eggs",
  },
  {
    key: "belgian_waffles",
    label: "Belgian Waffles",
  },
]

export const SingleSelect: Story = {
  args: {
    value: "bagel",
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
