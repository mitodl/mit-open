import React from "react"
import {
  renderRoutesWithProviders,
  renderWithProviders,
  screen,
} from "../../test-utils"
import RestrictedRoute from "./RestrictedRoute"
import { ForbiddenError, Permissions } from "@/common/permissions"
import { allowConsoleErrors } from "ol-test-utilities"

test("Renders children if permission check satisfied", () => {
  renderWithProviders(
    <RestrictedRoute requires={Permissions.Authenticated}>
      Hello, world!
    </RestrictedRoute>,
    { user: { is_authenticated: true } },
  )
  screen.getByText("Hello, world!")
})

test("Renders child routes if permission check satisfied.", () => {
  renderRoutesWithProviders(
    [
      {
        element: <RestrictedRoute requires={Permissions.Authenticated} />,
        children: [
          {
            element: "Hello, world!",
            path: "*",
          },
        ],
      },
    ],
    { user: { is_authenticated: true } },
  )
  screen.getByText("Hello, world!")
})

test.each(Object.values(Permissions))(
  "Throws error if and only if lacking required permission",
  (permission) => {
    allowConsoleErrors()
    expect(() => {
      renderWithProviders(
        <RestrictedRoute requires={permission}>Hello, world!</RestrictedRoute>,
      )
    }).toThrow(ForbiddenError)

    expect(() => {
      renderWithProviders(
        <RestrictedRoute requires={permission}>Hello, world!</RestrictedRoute>,
        { user: { [permission]: true } },
      )
    }).not.toThrow()
  },
)
