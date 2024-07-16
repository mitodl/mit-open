import React from "react"
import { render, screen } from "@testing-library/react"
import user from "@testing-library/user-event"
import { BooleanRadioChoiceField } from "./RadioChoiceField"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"

describe("BooleanRadioChoiceField", () => {
  it.each([
    {
      value: true,
      expectedChecks: { yes: true, no: false },
    },
    {
      value: false,
      expectedChecks: { yes: false, no: true },
    },
    {
      value: undefined,
      expectedChecks: { yes: false, no: false },
    },
  ])("renders correctly", ({ value, expectedChecks }) => {
    const onChange = jest.fn()
    render(
      <BooleanRadioChoiceField
        value={value}
        label="Test"
        name="test"
        choices={[
          { label: "Yes", value: true },
          { label: "No", value: false },
        ]}
        onChange={onChange}
      />,
      { wrapper: ThemeProvider },
    )
    const yes = screen.getByLabelText<HTMLInputElement>("Yes")
    const no = screen.getByLabelText<HTMLInputElement>("No")
    expect(yes.checked).toBe(expectedChecks.yes)
    expect(no.checked).toBe(expectedChecks.no)
  })

  it("calls onChange when clicking and converts value to boolean", async () => {
    const onChange = jest.fn()
    render(
      <BooleanRadioChoiceField
        label="Test"
        name="test"
        choices={[
          { label: "Yes", value: true },
          { label: "No", value: false },
        ]}
        onChange={onChange}
      />,
      { wrapper: ThemeProvider },
    )
    await user.click(screen.getByLabelText("Yes"))
    expect(onChange).toHaveBeenCalledWith({ name: "test", value: true })
    await user.click(screen.getByLabelText("No"))
    expect(onChange).toHaveBeenCalledWith({ name: "test", value: false })
  })
})
