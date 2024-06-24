import React from "react"
import { render, screen } from "@testing-library/react"
import user from "@testing-library/user-event"
import { SimpleSelect, SimpleSelectField } from "./SimpleSelect"
import type { SimpleSelectProps } from "./SimpleSelect"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"

const OPTIONS = [
  {
    label: "Option 1",
    value: "option1",
  },
  {
    label: "Option 2",
    value: "option2",
  },
  {
    label: "Option 3",
    value: "option3",
    disabled: true,
  },
]

const setupInput = (props: Partial<SimpleSelectProps> = {}) => {
  const onChange = jest.fn()
  const view = render(
    <SimpleSelect
      options={OPTIONS}
      value={props.value ?? "option1"}
      onChange={onChange}
      name="select-example"
    />,
    { wrapper: ThemeProvider },
  )

  return { onChange, view }
}

const setupField = (props: Partial<SimpleSelectProps> = {}) => {
  const onChange = jest.fn()
  const view = render(
    <SimpleSelectField
      options={OPTIONS}
      value={props.value ?? "option1"}
      onChange={onChange}
      name="select-example"
      label="Select Example"
    />,
    { wrapper: ThemeProvider },
  )

  return { onChange, view }
}

test.each([
  { setup: setupInput, label: "SimpleSelect" },
  { setup: setupField, label: "SimpleSelectField" },
])("$label Renders options and calls onChange", async ({ setup }) => {
  const { onChange } = setup()
  const select = screen.getByRole("combobox")
  await user.click(select)
  const options = screen.getAllByRole("option")
  expect(options).toHaveLength(3)
  expect(options[0]).toHaveTextContent("Option 1")
  expect(options[1]).toHaveTextContent("Option 2")
  expect(options[2]).toHaveTextContent("Option 3")

  expect(options[0]).not.toHaveClass("Mui-disabled")
  expect(options[1]).not.toHaveClass("Mui-disabled")
  expect(options[2]).toHaveClass("Mui-disabled")

  expect(screen.getByRole("option", { selected: true })).toBe(options[0])

  await user.click(options[1])
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      target: { value: "option2", name: "select-example" },
    }),
    expect.anything(),
  )
})
