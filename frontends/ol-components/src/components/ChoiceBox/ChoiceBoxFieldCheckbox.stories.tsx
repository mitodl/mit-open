import React, { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { CheckboxChoiceBoxField } from "./ChoiceBoxField"
import type { CheckboxChoiceBoxFieldProps } from "./ChoiceBoxField"

const CHOICES = [
  { label: "Item 1", value: "item1" },
  { label: "Item 2", value: "item2" },
  { label: "Item 3", value: "item3" },
  { label: "Item 4", value: "item4" },
  { label: "Item 5", value: "item5" },
  { label: "Item 6", value: "item6" },
  { label: "Item 7", value: "item7" },
  { label: "Item 8", value: "item8" },
  { label: "Item 9", value: "item9" },
  { label: "Item 10", value: "item10" },
]

const StateWrapper = (props: CheckboxChoiceBoxFieldProps) => {
  const [values, setValues] = useState<string[]>([])

  const handleChange = (event: React.SyntheticEvent) => {
    setValues((prev: string[]) => {
      const target = event.target as HTMLInputElement
      if (target.checked) {
        return [...prev, target.value]
      } else {
        return prev.filter((value) => value !== target.value)
      }
    })
  }

  return (
    <CheckboxChoiceBoxField
      {...props}
      onChange={handleChange}
      values={values}
      gridProps={{
        columns: {
          xs: 12,
        },
      }}
      gridItemProps={{
        xs: 4,
      }}
    />
  )
}

const meta: Meta<typeof CheckboxChoiceBoxField> = {
  title: "ol-components/ChoiceBoxField",
  component: StateWrapper,
}

export default meta

type Story = StoryObj<typeof CheckboxChoiceBoxField>

export const Checkbox: Story = {
  args: {
    label: "Choice Box Field Label",
    choices: CHOICES,
  },
}

export const CheckboxDescriptions: Story = {
  args: {
    label: "Choice Box Field Label",
    choices: CHOICES.map((choice) => ({
      ...choice,
      description: "Description",
    })),
  },
}
