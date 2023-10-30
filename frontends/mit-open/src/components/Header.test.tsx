import React from "react"
import Header from "./Header"
import { renderWithProviders, screen, within } from "../test-utils"

describe("Header", () => {
  it("Includes a link to MIT Homepage", async () => {
    renderWithProviders(<Header />)
    const header = screen.getByRole("banner")
    within(header).getByTitle("MIT Homepage", { exact: false })
  })
})
