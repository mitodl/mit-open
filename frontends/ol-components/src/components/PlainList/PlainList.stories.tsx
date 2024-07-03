import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { PlainList } from "./PlainList"
import styled from "@emotion/styled"

const Item = styled.li`
  background-color: lightsteelblue;
`

const meta: Meta<typeof PlainList> = {
  title: "smoot-design/PlainList",
  render: (args) => {
    return (
      <PlainList {...args}>
        {Array(5)
          .fill(null)
          .map((_, i) => (
            <Item key={i}>Item {i}</Item>
          ))}
      </PlainList>
    )
  },
  args: {
    itemSpacing: 0,
    disabled: false,
  },
}

export default meta

type Story = StoryObj<typeof PlainList>

export const Basic: Story = {}
