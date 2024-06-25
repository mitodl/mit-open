import React, { useState, ChangeEvent } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { ChoiceBox } from "./ChoiceBox"
import type { ChoiceBoxProps } from "./ChoiceBox"

const StateWrapper = (props: ChoiceBoxProps) => {
  const [checked, setChecked] = useState(!!props.checked)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked)
  }

  return <ChoiceBox {...props} checked={checked} onChange={handleChange} />
}

const meta: Meta<typeof ChoiceBox> = {
  title: "ol-components/ChoiceBox",
  component: StateWrapper,
  argTypes: {
    type: {
      options: ["radio", "checkbox"],
      control: { type: "select" },
    },
  },
}

export default meta

type Story = StoryObj<typeof ChoiceBox>

export const Radio: Story = {
  args: {
    label: "Radio Choice Box",
    type: "radio",
  },
}

export const RadioDescription: Story = {
  args: {
    label: "Radio Choice Box with Description",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat",
    type: "radio",
  },
}

export const Checkbox: Story = {
  args: {
    label: "Checkbox Choice Box",
    type: "checkbox",
  },
}

export const CheckboxDescription: Story = {
  args: {
    label: "Checkbox Choice Box with Description",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat",
    type: "checkbox",
  },
}
