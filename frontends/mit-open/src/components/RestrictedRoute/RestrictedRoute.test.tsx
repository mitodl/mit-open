import React from "react"
import {
  renderRoutesWithProviders,
  screen,
  setMockResponse,
  waitFor,
} from "../../test-utils"
import { urls } from "api/test-utils"
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

  setMockResponse.get(urls.userMe.get(), {
    [Permissions.Authenticated]: true,
  })

  renderRoutesWithProviders([
    {
      path: "*",
      element: (
        <RestrictedRoute requires={Permissions.Authenticated}>
          Hello, world!
        </RestrictedRoute>
      ),
      errorElement: <ErrorRecord errors={errors} />,
    },
  ])

  screen.getByText("Hello, world!")
  expect(!errors.length).toBe(true)
})

test("Renders child routes if permission check satisfied.", () => {
  const errors: unknown[] = []

  setMockResponse.get(urls.userMe.get(), {
    [Permissions.Authenticated]: true,
  })

  renderRoutesWithProviders([
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
  ])

  screen.getByText("Hello, world!")
  expect(!errors.length).toBe(true)
})

test.each(Object.values(Permissions))(
  "Throws error if and only if lacking required permission",
  async (permission) => {
    const errors: unknown[] = []

    setMockResponse.get(urls.userMe.get(), { [permission]: false })

    allowConsoleErrors()

    renderRoutesWithProviders([
      {
        path: "*",
        element: (
          <RestrictedRoute requires={permission}>Hello, world!</RestrictedRoute>
        ),
        errorElement: <ErrorRecord errors={errors} />,
      },
    ])

    await waitFor(() => {
      expect(errors.length > 0).toBe(true)
    })

    expect(errors[0]).toBeInstanceOf(ForbiddenError)
  },
)
