import React from "react"
import { renderWithProviders, screen } from "../../test-utils"
import RestrictedRoute from "./RestrictedRoute"
import { Permissions } from "@/common/permissions"
import { allowConsoleErrors } from "ol-test-utilities"

test("Renders children if permission check satisfied", () => {
  const errors: unknown[] = []

  renderWithProviders(
    <RestrictedRoute requires={Permissions.Authenticated}>
      Hello, world!
    </RestrictedRoute>,

    {
      user: { [Permissions.Authenticated]: true },
    },
  )

  screen.getByText("Hello, world!")
  expect(!errors.length).toBe(true)
})

test.each(Object.values(Permissions))(
  "Throws error if and only if lacking required permission",
  async (permission) => {
    // if a user is not authenticated they are redirected to login before an error is thrown
    if (permission === Permissions.Authenticated) {
      return
    }
    allowConsoleErrors()

    expect(() =>
      renderWithProviders(
        <RestrictedRoute requires={permission}>Hello, world!</RestrictedRoute>,
        {
          user: { [permission]: false },
        },
      ),
    ).toThrow("Not allowed.")
  },
)
