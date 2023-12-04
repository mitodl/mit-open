import React from "react"
import { renderRoutesWithProviders, screen } from "../test-utils"
import { render } from "@testing-library/react"
import RestrictedRoute from "./RestrictedRoute"
import { ForbiddenError } from "../util/permissions"
import { allowConsoleErrors } from "ol-util/test-utils"

test("Renders children if `allow` returns true", () => {
  const allow = jest.fn(() => true)
  render(<RestrictedRoute allow={allow}>Hello, world!</RestrictedRoute>)
  screen.getByText("Hello, world!")
})

test("Renders child routes if `allow` returns true.", () => {
  const allow = jest.fn(() => true)
  renderRoutesWithProviders([
    {
      element: <RestrictedRoute allow={allow} />,
      children: [
        {
          element: "Hello, world!",
          path: "*",
        },
      ],
    },
  ])
  screen.getByText("Hello, world!")
})

test("Calls `allow` with user and does throw if it returns false", () => {
  allowConsoleErrors()
  const allow = jest.fn(() => false)
  expect(() => {
    render(<RestrictedRoute allow={allow}>Hello world</RestrictedRoute>)
  }).toThrow(ForbiddenError)
  expect(allow).toHaveBeenCalledWith(window.SETTINGS.user)
})

test("Calls `allow` with user and does NOT throws if it returns true", () => {
  const allow = jest.fn(() => true)
  expect(() => {
    render(<RestrictedRoute allow={allow}>Hello, world!</RestrictedRoute>)
  }).not.toThrow()
  expect(allow).toHaveBeenCalledWith(window.SETTINGS.user)
})
