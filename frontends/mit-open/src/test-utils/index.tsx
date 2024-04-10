import React from "react"
import { createMemoryRouter, useRouteError } from "react-router"
import type { RouteObject } from "react-router"
import AppProviders from "../AppProviders"
import appRoutes from "../routes"
import { render } from "@testing-library/react"
import { createQueryClient } from "@/services/react-query/react-query"
import { useUserMe, User } from "api/hooks/user"
import { QueryCache } from "@tanstack/react-query"
import { setMockResponse, urls } from "api/test-utils"
import { allowConsoleErrors } from "ol-test-utilities"

interface TestAppOptions {
  url: string
  user: Partial<User>
}

const defaultTestAppOptions = {
  url: "/",
}

/**
 * React-router includes a default error boundary which catches thrown errors.
 *
 * During testing, we want all unexpected errors to be re-thrown.
 */
const RethrowError = () => {
  const error = useRouteError()
  if (error) {
    throw error
  }
  return null
}

/**
 * Mocks the autheniticated user API response and provides a promise to wait for
 * the user to be loaded.
 *
 * This allows us to explicitly wait for components dependent on the user to
 * have rendered so we can make assertions on the absence of elements where
 * we otherwise cannot differentiate between first render cycles (e.g. component
 * has returned null as the user hook isLoading, vs user has loaded and we are ready
 * to make the negative assertion).
 */
const setMockUser = (user: Partial<User>, queryCache: QueryCache) => {
  let resolve: (value: User | undefined) => void

  setMockResponse.get(urls.userMe.get(), user)

  const _waitForUser = new Promise((_resolve) => (resolve = _resolve))

  const WithAuthStatus: React.FC<{ children?: React.ReactNode }> = ({
    children,
  }) => {
    const { isLoading, data } = useUserMe()

    /* Looking for solutions to "Warning: An update to mockConstructor inside a test was not wrapped in act(...)."
     * Some info here: https://github.com/TanStack/query/issues/432
     * How do we wrap the React Query state changes that are triggering the re-render in act()?
     * allowConsoleErrors() supresses the warning but not a solution.
     */
    if (queryCache.find(["userMe"])?.state.status !== "success") {
      return null
    }

    if (isLoading) {
      return null
    }

    resolve(data)
    return children
  }

  allowConsoleErrors()

  return {
    _waitForUser,
    WithAuthStatus,
  }
}

/**
 * Render routes in a test environment using same providers used by App.
 */
const renderRoutesWithProviders = (
  routes: RouteObject[],
  options: Partial<TestAppOptions> = {},
) => {
  const { url, user } = {
    ...defaultTestAppOptions,
    ...options,
  }

  let waitForUser = null

  const queryClient = createQueryClient()
  const queryCache = queryClient.getQueryCache()

  if (user) {
    const { _waitForUser, WithAuthStatus } = setMockUser(user, queryCache)
    waitForUser = () => _waitForUser
    routes = routes.map((route) => ({
      ...route,
      element: <WithAuthStatus>{route.element}</WithAuthStatus>,
    }))
  }

  const router = createMemoryRouter(routes, { initialEntries: [url] })

  const view = render(
    <AppProviders queryClient={queryClient} router={router}></AppProviders>,
  )

  const location = {
    get current() {
      return router.state.location
    },
  }

  return { view, queryClient, location, waitForUser, queryCache }
}

const renderTestApp = (options?: Partial<TestAppOptions>) =>
  renderRoutesWithProviders(appRoutes, options)

/**
 * Render element in a test environment using same providers used by App.
 */
const renderWithProviders = (
  element: React.ReactNode,
  options?: Partial<TestAppOptions>,
) => {
  const routes: RouteObject[] = [
    {
      element,
      path: "*",
      errorElement: <RethrowError />,
    },
  ]

  return renderRoutesWithProviders(routes, options)
}

/**
 * Assert that a functional component was called at some point with the given
 * props.
 * @param fc the mock or spied upon functional component
 * @param partialProps an object of props
 */
const expectProps = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fc: (...args: any[]) => void,
  partialProps: unknown,
) => {
  expect(fc).toHaveBeenCalledWith(
    expect.objectContaining(partialProps),
    expect.anything(),
  )
}

/**
 * Assert that a functional component was last called with the given
 * props.
 * @param fc the mock or spied upon functional component
 * @param partialProps an object of props
 */
const expectLastProps = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fc: jest.Mock<any, any>,
  partialProps: unknown,
) => {
  expect(fc).toHaveBeenLastCalledWith(
    expect.objectContaining(partialProps),
    expect.anything(),
  )
}

/**
 * Useful for checking that "real" navigation occurs, i.e., navigation with a
 * full browser reload, not React Router's SPA-routing.
 */
const expectWindowNavigation = async (cb: () => void | Promise<void>) => {
  const consoleError = console.error
  try {
    const spy = jest.spyOn(console, "error").mockImplementation()
    await cb()
    expect(spy).toHaveBeenCalledTimes(1)
    const error = spy.mock.calls[0][0]
    expect(error instanceof Error)
    expect(error.message).toMatch(/Not implemented: navigation/)
  } finally {
    console.error = consoleError
  }
}

export {
  renderTestApp,
  renderWithProviders,
  renderRoutesWithProviders,
  expectProps,
  expectLastProps,
  expectWindowNavigation,
}
// Conveniences
export { setMockResponse }
export {
  act,
  screen,
  prettyDOM,
  within,
  fireEvent,
  waitFor,
  renderHook,
} from "@testing-library/react"
export { default as user } from "@testing-library/user-event"

export type { TestAppOptions, User }
