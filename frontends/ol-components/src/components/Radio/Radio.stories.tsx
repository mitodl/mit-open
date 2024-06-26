import React, { useState, ChangeEvent } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Radio } from "./Radio"
import type { RadioProps } from "./Radio"

const StateWrapper = (props: RadioProps) => {
  const [checked, setChecked] = useState(!!props.checked)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked)
  }

  return <Radio {...props} checked={checked} onChange={handleChange} />
}

const meta: Meta<typeof Radio> = {
  title: "ol-components/Radio",
  component: StateWrapper,
}

export default meta

type Story = StoryObj<typeof Radio>

export const Simple: Story = {}

export const WithLabel: Story = {
  args: {
    label: "Radio",
    name: "group",
  },
}
