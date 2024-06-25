import React, { useState, ChangeEvent } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { faker } from "@faker-js/faker/locale/en"
import { RadioChoiceBoxField } from "./ChoiceBoxField"
import type { RadioChoiceBoxFieldProps } from "./ChoiceBoxField"

const sentence = () => faker.lorem.sentence({ min: 1, max: 3 }).slice(0, -1)

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
      description: faker.lorem.paragraph(2),
    })),
  },
}
