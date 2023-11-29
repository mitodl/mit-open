import React from "react"
import { createMemoryRouter } from "react-router"
import type { RouteObject } from "react-router"

import { AppProviders } from "../AppProviders"
import appRoutes from "../routes"
import { render } from "@testing-library/react"
import { setMockResponse } from "./mockAxios"
import { createQueryClient } from "../libs/react-query"
import type { User } from "../types/settings"
import { makeUserSettings } from "./factories"

interface TestAppOptions {
  url: string
  user: Partial<User>
}

const defaultTestAppOptions = {
  url: "/",
}

/**
 * Render routes in a test environment using same providers used by App.
 */
const renderRoutesWithProviders = (
  routes: RouteObject[],
  options: Partial<TestAppOptions> = {},
) => {
  const { url } = { ...defaultTestAppOptions, ...options }

  // window.SETTINGS is reset during tests via afterEach hook.
  window.SETTINGS.user = makeUserSettings(options.user)

  const router = createMemoryRouter(routes, { initialEntries: [url] })
  const queryClient = createQueryClient()
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
  const routes: RouteObject[] = [{ element, path: "*" }]
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
  fc: jest.Mock<any, any>,
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

export {
  renderTestApp,
  renderWithProviders,
  renderRoutesWithProviders,
  expectProps,
  expectLastProps,
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
} from "@testing-library/react"
export { default as user } from "@testing-library/user-event"

export type { TestAppOptions, User }
