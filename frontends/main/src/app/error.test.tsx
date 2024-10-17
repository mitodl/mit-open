import React from "react"
import { renderWithProviders, screen } from "@/test-utils"
import { HOME } from "@/common/urls"
import ErrorPage from "./error"
import { ForbiddenError } from "@/common/permissions"

test("The error page shows error message", () => {
  const error = new Error("Ruh roh")
  renderWithProviders(<ErrorPage error={error} />)
  screen.getByRole("heading", { name: "Something went wrong." })
  screen.getByText("Ruh roh")
  const homeLink = screen.getByRole("link", { name: "Home" })
  expect(homeLink).toHaveAttribute("href", HOME)
})

test("The NotFoundPage loads with a link that directs to HomePage", () => {
  const error = new ForbiddenError("You can't do that")
  renderWithProviders(<ErrorPage error={error} />, { user: {} })
  screen.getByRole("heading", { name: "Not Allowed" })
  const homeLink = screen.getByRole("link", { name: "Home" })
  expect(homeLink).toHaveAttribute("href", HOME)
})
