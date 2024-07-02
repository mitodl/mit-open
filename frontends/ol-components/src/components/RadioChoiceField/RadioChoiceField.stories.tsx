import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { useArgs } from "@storybook/preview-api"
import { RadioChoiceField, BooleanRadioChoiceField } from "./RadioChoiceField"

const meta: Meta<typeof RadioChoiceField> = {
  title: "smoot-design/RadioChoiceField",
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
  },
  argTypes: {
    value: {
      options: ["option-1", "option-2", "option-3"],
      defaultValue: "option-1",
      control: {
        type: "select",
      },
    },
  },
  render: function Render(args) {
    const [_args, setArgs] = useArgs()
    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const { currentTarget } = event
      args.onChange?.(event, currentTarget.value)
      setArgs({ value: currentTarget.value })
    }
    return <RadioChoiceField {...args} onChange={onChange} />
  },
}

type BooleanStory = StoryObj<typeof BooleanRadioChoiceField>

export const Boolean: BooleanStory = {
  args: {
    label: "Boolean radio choice field label",
    value: true,
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
  render: function Render(args) {
    const [_args, setArgs] = useArgs()
    const onChange = (event: { name: string; value: boolean }) => {
      const { value } = event
      args.onChange?.({ name: value.toString(), value })
      setArgs({ value })
    }
    return <BooleanRadioChoiceField {...args} onChange={onChange} />
  },
}
