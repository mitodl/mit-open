import React, { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { SimpleSelect, SimpleSelectProps } from "./SimpleSelect"
import type { SelectChangeEvent } from "@mui/material/Select"

function StateWrapper(props: SimpleSelectProps) {
  const [value, setValue] = useState(props.initialValue)

  const handleChange = (event: SelectChangeEvent<string | string[]>) => {
    setValue(event.target.value)
  }

  return (
    <SimpleSelect {...props} initialValue={value} onChange={handleChange} />
  )
}

const meta: Meta<typeof SimpleSelect> = {
  title: "ol-components/SimpleSelect",
  component: StateWrapper,
  argTypes: {
    isMultiple: {
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
    initialValue: "bagel",
    isMultiple: false,
    options: options,
  },
}

export const MultipleSelect: Story = {
  args: {
    initialValue: ["bagel", "bacon"],
    isMultiple: true,
    options: options,
  },
}
