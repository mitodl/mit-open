import React from "react"
import { createMemoryRouter, useRouteError } from "react-router"
import type { RouteObject } from "react-router"

import AppProviders from "../AppProviders"
import appRoutes from "../routes"
import { render } from "@testing-library/react"
import { setMockResponse } from "./mockAxios"
import { createQueryClient } from "@/services/react-query/react-query"
import type { User } from "../types/settings"
import { QueryKey } from "@tanstack/react-query"

interface TestAppOptions {
  url: string
  user: Partial<User>
  queryClient?: ReturnType<typeof createQueryClient>
  initialQueryData?: [QueryKey, unknown][]
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
 * Render routes in a test environment using same providers used by App.
 */
const renderRoutesWithProviders = (
  routes: RouteObject[],
  options: Partial<TestAppOptions> = {},
) => {
  const { url, user, initialQueryData } = {
    ...defaultTestAppOptions,
    ...options,
  }

  const router = createMemoryRouter(routes, { initialEntries: [url] })
  const queryClient = options.queryClient || createQueryClient()

  if (user) {
    queryClient.setQueryData(["userMe"], { is_authenticated: true, ...user })
  }
  if (initialQueryData) {
    initialQueryData.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data)
    })
  }
  const view = render(
    <AppProviders queryClient={queryClient} router={router}></AppProviders>,
  )

  const location = {
    get current() {
      return router.state.location
    },
  }

  return { view, queryClient, location }
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
    { element, path: "*", errorElement: <RethrowError /> },
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
