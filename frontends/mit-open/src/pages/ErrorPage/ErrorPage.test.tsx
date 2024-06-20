import React from "react"
import { waitFor } from "@testing-library/react"
import { useQuery } from "@tanstack/react-query"
import { renderRoutesWithProviders, renderTestApp } from "../../test-utils"
import type { TestAppOptions } from "../../test-utils"
import ErrorPage from "./ErrorPage"
import { setMockResponse, mockAxiosInstance as axios } from "api/test-utils"
import { allowConsoleErrors } from "ol-test-utilities"
import RestrictedRoute from "@/components/RestrictedRoute/RestrictedRoute"
import { Permissions } from "@/common/permissions"

/**
 * Renders an erroring-component within a react-router ErrorBoundary using
 * ErrorPage as its display. The component errors via a react-query API call
 * that resolves with the given status code.
 */
const setup = (statusCode: number, opts?: Partial<TestAppOptions>) => {
  setMockResponse.get("/foo", null, { code: statusCode })

  const TestComponent = () => {
    useQuery({
      queryFn: async () => axios.get("/foo"),
      queryKey: ["key"],
    })
    return null
  }

  return renderRoutesWithProviders(
    [
      {
        path: "*",
        errorElement: <ErrorPage />,
        element: <TestComponent />,
      },
    ],
    opts,
  )
}

test.each([{ status: 401 }, { status: 403 }])(
  "ErrorPage shows ForbiddenPage on $status errors",
  async ({ status }) => {
    allowConsoleErrors()
    // 401 for authenticated users is unrealisted, but we test the login
    // redirect elsewhere.
    setup(status, { user: { is_authenticated: true } })
    await waitFor(() => {
      expect(document.title).toBe("Not Allowed | MIT Open")
    })
  },
)

test("ErrorPage shows NotFound on API 404 errors", async () => {
  allowConsoleErrors()
  setup(404)
  await waitFor(() => {
    expect(document.title).toBe("Not Found | MIT Open")
  })
})

test("ErrorPage shows NotFound on frontend routing 404 errors", async () => {
  allowConsoleErrors()
  renderTestApp({ url: "/some-fake-route" })
  await waitFor(() => {
    expect(document.title).toBe("Not Found | MIT Open")
  })
})

test("ErrorPage shows ForbiddenPage on restricted routes.", async () => {
  allowConsoleErrors()
  renderRoutesWithProviders(
    [
      {
        errorElement: <ErrorPage />,
        children: [
          {
            element: (
              <RestrictedRoute requires={Permissions.ArticleEditor}>
                You shall not pass.
              </RestrictedRoute>
            ),
            path: "*",
          },
        ],
      },
    ],
    { user: { is_authenticated: true } },
  )
  await waitFor(() => {
    expect(document.title).toBe("Not Allowed | MIT Open")
  })
})

test("ErrorPage shows fallback and logs unexpected errors", async () => {
  const { consoleError } = allowConsoleErrors()
  const ThrowError = () => {
    throw new Error("Some Error")
  }
  renderRoutesWithProviders(
    [
      {
        errorElement: <ErrorPage />,
        element: <ThrowError />,
        path: "*",
      },
    ],
    { user: { is_authenticated: true } },
  )
  await waitFor(() => {
    expect(document.title).toBe("Not Allowed | MIT Open")
  })
  expect(consoleError).toHaveBeenCalledWith(Error("Some Error"))
})
