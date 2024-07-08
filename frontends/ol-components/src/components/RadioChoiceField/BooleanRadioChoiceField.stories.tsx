import React, { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import {
  BooleanRadioChoiceField,
  BooleanRadioChoiceFieldProps,
} from "./RadioChoiceField"

function StateWrapper(props: BooleanRadioChoiceFieldProps) {
  const [value, setValue] = useState(props.value)
  const onChange = (event: { name: string; value: boolean }) => {
    const { value } = event
    props.onChange?.({ name: "Test", value })
    setValue(value)
  }
  return (
    <BooleanRadioChoiceField {...props} value={value} onChange={onChange} />
  )
}

const meta: Meta<typeof BooleanRadioChoiceField> = {
  title: "~smoot-design/BooleanRadioChoiceField",
  component: StateWrapper,
  argTypes: {
    onChange: {
      action: "changed",
    },
    value: {
      disabled: true,
    },
  },
}

export default meta

type Story = StoryObj<typeof BooleanRadioChoiceField>

export const Simple: Story = {
  args: {
    label: "Boolean radio choice field label",
    value: true,
    defaultValue: "option-1",
    name: "Radio choice field name",
    choices: [
      {
        value: true,
        label: "True",
      },
      {
        value: false,
        label: "False",
      },
    ],
  },
}
