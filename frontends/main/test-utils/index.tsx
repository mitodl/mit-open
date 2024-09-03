/* eslint-disable import/no-extraneous-dependencies */
import React from "react"
import { createMemoryRouter, useRouteError } from "react-router"
import type { RouteObject } from "react-router"

// @ts-expect-error Fixing tests next
import AppProviders from "../AppProviders"
// @ts-expect-error Fixing tests next
import appRoutes from "../routes"
import { render } from "@testing-library/react"
import { setMockResponse } from "api/test-utils"
// @ts-expect-error Fixing tests next
import { createQueryClient } from "@/services/react-query/react-query"
import type { User } from "api/hooks/user"
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

const ignoreError = (errorMessage: string, timeoutMs?: number) => {
  const consoleError = console.error
  const spy = jest.spyOn(console, "error").mockImplementation((...args) => {
    if (args[0]?.includes(errorMessage)) {
      return
    }
    return consoleError.call(console, args)
  })

  const timeout = setTimeout(() => {
    throw new Error(
      `Ignored console error not cleared after ${timeoutMs || 5000}ms: "${errorMessage}"`,
    )
  }, timeoutMs || 5000)

  const clear = () => {
    console.error = consoleError
    spy.mockClear()
    clearTimeout(timeout)
  }

  return { clear }
}

const getMetaContent = ({
  property,
  name,
}: {
  property?: string
  name?: string
}) => {
  const propSelector = property ? `[property="${property}"]` : ""
  const nameSelector = name ? `[name="${name}"]` : ""
  const selector = `meta${propSelector}${nameSelector}`
  const el = document.querySelector<HTMLMetaElement>(selector)
  return el?.content
}

type TestableMetas = {
  title?: string | null
  description?: string | null
  og: {
    image?: string | null
    imageAlt?: string | null
    description?: string | null
    title?: string | null
  }
  twitter: {
    card?: string | null
    image?: string | null
    description?: string | null
  }
}
const getMetas = (): TestableMetas => {
  return {
    title: document.title,
    description: getMetaContent({ name: "description" }),
    og: {
      image: getMetaContent({ property: "og:image" }),
      imageAlt: getMetaContent({ property: "og:image:alt" }),
      description: getMetaContent({ property: "og:description" }),
      title: getMetaContent({ property: "og:title" }),
    },
    twitter: {
      card: getMetaContent({ name: "twitter:card" }),
      image: getMetaContent({ name: "twitter:image:src" }),
      description: getMetaContent({ name: "twitter:description" }),
    },
  }
}
const assertPartialMetas = (expected: Partial<TestableMetas>) => {
  expect(getMetas()).toEqual(
    expect.objectContaining({
      ...expected,
      og: expect.objectContaining(expected.og ?? {}),
      twitter: expect.objectContaining(expected.twitter ?? {}),
    }),
  )
}

export {
  renderTestApp,
  renderWithProviders,
  renderRoutesWithProviders,
  expectProps,
  expectLastProps,
  expectWindowNavigation,
  ignoreError,
  getMetas,
  assertPartialMetas,
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
