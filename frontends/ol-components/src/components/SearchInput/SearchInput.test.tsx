import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SearchInput, type SearchInputProps } from "./SearchInput"
import invariant from "tiny-invariant"
import { ThemeProvider } from "ol-components"
const getSearchInput = () => {
  const element = screen.getByLabelText("Search for")
  invariant(element instanceof HTMLInputElement)
  return element
}

const getSearchButton = (): HTMLButtonElement => {
  const button = screen.getByLabelText("Search")
  invariant(button instanceof HTMLButtonElement)
  return button
}

/**
 * This actually returns an icon (inside a button)
 */
const getClearButton = (): HTMLButtonElement => {
  const button = screen.getByLabelText("Clear search text")
  invariant(button instanceof HTMLButtonElement)
  return button
}

const searchEvent = (value: string) =>
  expect.objectContaining({ target: { value } })

describe("SearchInput", () => {
  const renderSearchInput = (props: Partial<SearchInputProps> = {}) => {
    const { value = "", ...otherProps } = props
    const onSubmit = jest.fn()
    const onChange = jest.fn((e) => e.persist())
    const onClear = jest.fn()
    render(
      <SearchInput
        value={value}
        onSubmit={onSubmit}
        onChange={onChange}
        onClear={onClear}
        {...otherProps}
      />,
      { wrapper: ThemeProvider },
    )
    const user = userEvent.setup()
    const spies = { onClear, onChange, onSubmit }
    return { user, spies }
  }

  it("Renders the given value in input", () => {
    renderSearchInput({ value: "math" })
    expect(getSearchInput().value).toBe("math")
  })

  it("Calls onChange when text is typed", async () => {
    const { user, spies } = renderSearchInput({ value: "math" })
    const input = getSearchInput()
    await user.type(getSearchInput(), "s")
    expect(spies.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: input }),
    )
  })

  it("Calls onSubmit when search is clicked", async () => {
    const { user, spies } = renderSearchInput({ value: "chemistry" })
    await user.click(getSearchButton())
    expect(spies.onSubmit).toHaveBeenCalledWith(searchEvent("chemistry"), {
      isEnter: false,
    })
  })

  it("Calls onSubmit when 'Enter' is pressed", async () => {
    const { user, spies } = renderSearchInput({ value: "chemistry" })
    await user.type(getSearchInput(), "{enter}")
    expect(spies.onSubmit).toHaveBeenCalledWith(searchEvent("chemistry"), {
      isEnter: true,
    })
  })

  it("Calls onClear clear is clicked", async () => {
    const { user, spies } = renderSearchInput({ value: "biology" })
    await user.click(getClearButton())
    expect(spies.onClear).toHaveBeenCalled()
  })
})
