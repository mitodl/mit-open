import React, { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import {
  SearchInput,
  SearchInputProps,
  SearchSubmissionEvent,
} from "./SearchInput"

function StateWrapper(props: SearchInputProps) {
  const [value, setValue] = useState(props.value)
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    props.onChange?.(event)
    setValue(event.currentTarget.value)
  }
  const onClear = (event: React.MouseEvent<HTMLInputElement>) => {
    props.onClear(event)
    setValue("")
  }
  const onSubmit = (event: SearchSubmissionEvent) => {
    props.onSubmit(event)
    setValue("")
  }
  return (
    <SearchInput
      {...props}
      value={value}
      onChange={onChange}
      onClear={onClear}
      onSubmit={onSubmit}
    />
  )
}

const meta: Meta<typeof SearchInput> = {
  title: "ol-components/SearchInput",
  component: StateWrapper,
  argTypes: {
    onChange: {
      action: "changed",
    },
    onClear: {
      action: "cleared",
    },
    onSubmit: {
      action: "submitted",
    },
  },
}

export default meta

type Story = StoryObj<typeof SearchInput>

export const Simple: Story = {
  args: {
    className: "",
    classNameClear: "",
    classNameSearch: "",
    placeholder: "Placeholder",
    autoFocus: true,
  },
}
