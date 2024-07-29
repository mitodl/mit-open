import React from "react"
import { renderRoutesWithProviders, screen, waitFor } from "../../test-utils"
import RestrictedRoute from "./RestrictedRoute"
import { ForbiddenError, Permissions } from "@/common/permissions"
import { allowConsoleErrors } from "ol-test-utilities"
import { useRouteError } from "react-router"

const ErrorRecord: React.FC<{ errors: unknown[] }> = ({ errors }) => {
  const error = useRouteError()
  if (error) {
    errors.push(error)
  }
  return null
}

test("Renders children if permission check satisfied", () => {
  const errors: unknown[] = []

  renderRoutesWithProviders(
    [
      {
        path: "*",
        element: (
          <RestrictedRoute requires={Permissions.Authenticated}>
            Hello, world!
          </RestrictedRoute>
        ),
        errorElement: <ErrorRecord errors={errors} />,
      },
    ],
    {
      user: { [Permissions.Authenticated]: true },
    },
  )

  screen.getByText("Hello, world!")
  expect(!errors.length).toBe(true)
})

test("Renders child routes if permission check satisfied.", () => {
  const errors: unknown[] = []

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
        errorElement: <ErrorRecord errors={errors} />,
      },
    ],
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
    const errors: unknown[] = []

    allowConsoleErrors()

    renderRoutesWithProviders(
      [
        {
          path: "*",
          element: (
            <RestrictedRoute requires={permission}>
              Hello, world!
            </RestrictedRoute>
          ),
          errorElement: <ErrorRecord errors={errors} />,
        },
      ],
      {
        user: { [permission]: false },
      },
    )

    await waitFor(() => {
      expect(errors.length > 0).toBe(true)
    })

    expect(errors[0]).toBeInstanceOf(ForbiddenError)
  },
)
