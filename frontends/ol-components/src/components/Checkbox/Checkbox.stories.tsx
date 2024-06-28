import React, { useState, ChangeEvent } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Checkbox } from "./Checkbox"
import type { CheckboxProps } from "./Checkbox"

const StateWrapper = (props: CheckboxProps) => {
  const [checked, setChecked] = useState(!!props.checked)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked)
    props.onChange?.(event)
  }

  return <Checkbox {...props} checked={checked} onChange={handleChange} />
}

const meta: Meta<typeof Checkbox> = {
  title: "ol-components/Checkbox",
  component: StateWrapper,
  argTypes: {
    onChange: {
      action: "change",
    },
  },
}

export default meta

type Story = StoryObj<typeof Checkbox>

export const Simple: Story = {}

export const WithLabel: Story = {
  args: {
    label: "Checkbox",
  },
}
