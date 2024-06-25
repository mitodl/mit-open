import React, { useState, ChangeEvent } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { RadioChoiceBoxField } from "./ChoiceBoxField"
import type { RadioChoiceBoxFieldProps } from "./ChoiceBoxField"

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

const StateWrapper = (props: RadioChoiceBoxFieldProps) => {
  const [value, setValue] = useState<string>("")

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
  }

  return (
    <RadioChoiceBoxField
      {...props}
      onChange={handleChange}
      value={value}
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

const meta: Meta<typeof RadioChoiceBoxField> = {
  title: "ol-components/ChoiceBoxField",
  component: StateWrapper,
}

export default meta

type Story = StoryObj<typeof RadioChoiceBoxField>

export const Radio: Story = {
  args: {
    label: "Choice Box Field Label",
    choices: CHOICES,
  },
}

export const RadioDescriptions: Story = {
  args: {
    label: "Choice Box Field Label",
    choices: CHOICES.map((choice) => ({
      ...choice,
      description: "Description",
    })),
  },
}
