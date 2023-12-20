import React, { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { RadioChoiceField, RadioChoiceFieldProps } from "./RadioChoiceField"

function StateWrapper(props: RadioChoiceFieldProps) {
  const [value, setValue] = useState(props.value)
  const onChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    value: string,
  ) => {
    props.onChange?.(event, value)
    setValue(value)
  }
  return <RadioChoiceField {...props} value={value} onChange={onChange} />
}

const meta: Meta<typeof RadioChoiceField> = {
  title: "ol-components/RadioChoiceField",
  component: StateWrapper,
  argTypes: {
    onChange: {
      action: "changed",
    },
  },
}

export default meta

type Story = StoryObj<typeof RadioChoiceField>

export const Simple: Story = {
  args: {
    label: "Radio choice field label",
    value: "option-1",
    defaultValue: "option-1",
    name: "Radio choice field name",
    choices: [
      {
        value: "option-1",
        label: "Option 1",
      },
      {
        value: "option-2",
        label: "Option 2",
      },
      {
        value: "option-3",
        label: "Option 3",
      },
    ],
    // row?: boolean
    // onChange?: RadioGroupProps["onChange"]
    // className?: string
  },
}

// export const Secondary: Story = {
//   args: {
//     label: "Secondary Chip Link",
//     color: "secondary",
//   },
// }

// export const Disabled: Story = {
//   args: {
//     label: "Disabled Chip Link",
//     disabled: true,
//   },
// }
