import React from "react"
import { render, screen } from "@testing-library/react"

import { ThemeProvider } from "ol-components"
import { fields as factory } from "api/test-utils/factories"
import FieldAvatar from "./FieldAvatar"

describe("Avatar", () => {
  it("Displays a small avatar image for the field", async () => {
    const field = factory.field()
    render(<FieldAvatar field={field} imageSize="small" />, {
      wrapper: ThemeProvider,
    })
    const img = screen.getByRole("img")
    expect(img.getAttribute("alt")).toBe(null) // should be empty unless meaningful
    expect(img.getAttribute("src")).toEqual(field.avatar_small)
  })
  it("Displays a medium avatar image by default", async () => {
    const field = factory.field()
    render(<FieldAvatar field={field} />, { wrapper: ThemeProvider })
    const img = screen.getByRole("img")
    expect(img.getAttribute("alt")).toBe(null) // should be empty unless meaningful
    expect(img.getAttribute("src")).toEqual(field.avatar_medium)
  })
  it("Displays initials if no avatar image exists", async () => {
    const field = factory.field({
      title: "Test Title",
      avatar: null,
      avatar_small: null,
      avatar_medium: null,
    })
    render(<FieldAvatar field={field} />, { wrapper: ThemeProvider })
    const img = screen.queryByRole("img")
    expect(img).toBeNull()
    await screen.findByText("TT")
  })
})
