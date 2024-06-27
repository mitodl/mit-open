import React, { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { faker } from "@faker-js/faker/locale/en"
import { CheckboxChoiceBoxField } from "./ChoiceBoxField"
import type { CheckboxChoiceBoxFieldProps } from "./ChoiceBoxField"

const sentence = (count?: number) =>
  faker.lorem.sentence(count ?? { min: 1, max: 3 }).slice(0, -1)

const CHOICES = [
  { label: sentence(), value: "item1" },
  { label: sentence(), value: "item2" },
  { label: sentence(), value: "item3" },
  { label: sentence(), value: "item4" },
  { label: sentence(), value: "item5" },
  { label: sentence(), value: "item6" },
  { label: sentence(), value: "item7" },
  { label: sentence(), value: "item8" },
  { label: sentence(), value: "item9" },
  { label: sentence(), value: "item10" },
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
    label: "Choice Box Field",
    choices: CHOICES,
  },
}

export const CheckboxVaryingLength: Story = {
  args: {
    label: "Choice Box Field",
    choices: CHOICES.map((choices) => ({
      ...choices,
      label: sentence(Math.random() * 30),
    })),
  },
}

export const CheckboxDescriptions: Story = {
  args: {
    label: "Choice Box Field",
    choices: CHOICES.map((choice) => ({
      ...choice,
      description: faker.lorem.paragraph(2),
    })),
  },
}
