import React from "react"
import { render, screen } from "@testing-library/react"
import user from "@testing-library/user-event"
import { TextField } from "./TextField"
import type { TextFieldProps } from "./TextField"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"
import { faker } from "@faker-js/faker/locale/en"

const assertDescription = ({
  text,
  total,
  exists,
}: {
  text: string
  total: number
  exists: boolean
}) => {
  const input = screen.getByRole("textbox")
  const describedBy = input.getAttribute("aria-describedby")
  const descriptionIds = describedBy?.split(" ") ?? []
  if (total === 0) {
    expect(describedBy).toBe(null)
  }
  expect(descriptionIds.length).toBe(total)

  const description = screen.queryByText(text)
  expect(!!description).toBe(exists)
  if (exists) {
    expect(description).toBeInTheDocument()
    expect(descriptionIds).toContain(description?.id)
  }
}

describe("TextField", () => {
  const setup = (props: Partial<TextFieldProps>) => {
    const defaults = {
      name: "test-name",
      value: "test-value",
      label: "test-label",
    }
    const { rerender: _rerender } = render(
      <TextField {...defaults} {...props} />,
      {
        wrapper: ThemeProvider,
      },
    )
    const rerender = (newProps: Partial<TextFieldProps>) => {
      _rerender(<TextField {...defaults} {...newProps} />)
    }
    return { rerender }
  }

  it("Has a label", () => {
    const label = faker.lorem.words()
    setup({ label })
    const input = screen.getByRole("textbox", { name: label })
    expect(input).toBeInstanceOf(HTMLInputElement)
  })

  it("Has a description only if description provided", () => {
    const label = faker.lorem.words()
    const helpText = faker.lorem.words()
    const { rerender } = setup({ label, helpText })
    assertDescription({ text: helpText, total: 1, exists: true })

    rerender({ label })
    assertDescription({ text: helpText, total: 0, exists: false })
  })

  it("Has an error message only if errorText provided AND error=true", () => {
    const label = faker.lorem.words()
    const errorText = faker.lorem.words()
    const { rerender } = setup({ label, errorText, error: true })
    assertDescription({ text: errorText, total: 1, exists: true })

    rerender({ label, errorText })
    assertDescription({ text: errorText, total: 0, exists: false })
    rerender({ label, error: true })
    assertDescription({ text: errorText, total: 0, exists: false })
    rerender({ label, errorText, error: true })
    assertDescription({ text: errorText, total: 1, exists: true })
  })

  it("Shows both description and errormessage if both provided and error", () => {
    const label = faker.lorem.words()
    const errorText = faker.lorem.words()
    const helpText = faker.lorem.words()
    const { rerender } = setup({ label, errorText, helpText })
    assertDescription({ text: helpText, total: 1, exists: true })
    assertDescription({ text: errorText, total: 1, exists: false })
    rerender({ label, errorText, helpText, error: true })
    assertDescription({ text: helpText, total: 2, exists: true })
    assertDescription({ text: errorText, total: 2, exists: true })
  })

  it("Marks the input as required if required", () => {
    const label = faker.lorem.words()
    setup({ label, required: true })
    const input = screen.getByRole("textbox", { name: label })
    expect(input).toBeRequired()
  })

  it("Emits the correct value on change", async () => {
    const name = faker.lorem.word()
    const value = faker.lorem.words()
    const onChange = jest.fn()

    setup({ name, onChange, value })
    const input = screen.getByRole("textbox")
    await user.type(input, "x")
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ name }),
      }),
    )
  })

  it("Forwards inputProps and InputProps", () => {
    /**
     * NOTE: This behavior is important for integrating easily with MUI's
     * Autocomplete component
     */
    const inputRef = jest.fn()
    const InputRef = jest.fn()
    setup({
      inputProps: {
        ref: inputRef,
      },
      InputProps: {
        ref: InputRef,
      },
    })
    expect(inputRef).toHaveBeenCalledTimes(1)
    expect(inputRef).toHaveBeenCalledWith(expect.any(HTMLInputElement))
    expect(InputRef).toHaveBeenCalledTimes(1)
    expect(InputRef).toHaveBeenCalledWith(expect.any(HTMLDivElement))
  })
})
