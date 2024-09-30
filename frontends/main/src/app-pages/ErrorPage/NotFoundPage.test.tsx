import React from "react"
import { renderWithProviders, screen } from "@/test-utils"
import { HOME } from "@/common/urls"
import NotFoundPage from "./NotFoundPage"

test("The NotFoundPage loads with Correct Title", () => {
  renderWithProviders(<NotFoundPage />, {})
  screen.getByRole("heading", { name: "404 Not Found Error" })
})

test("The NotFoundPage loads with a link that directs to HomePage", () => {
  renderWithProviders(<NotFoundPage />, {})
  const homeLink = screen.getByRole("link", { name: "Home" })
  expect(homeLink).toHaveAttribute("href", HOME)
})
