/**
 * This is a mock for the next/navigation module used with the App Router.
 *
 * NOTE: next-router-mock is intended to mock the next/router module (used with
 * older Pages router.)
 *
 * See https://github.com/scottrippey/next-router-mock/issues
 */
import * as mocks from "next-router-mock"
import { ParsedUrlQuery } from "querystring"
import { createDynamicRouteParser } from "next-router-mock/dynamic-routes"

const getParams = (template: string, pathname: string) => {
  const route = template.split("/")
  const path = pathname.split("/")

  return route.reduce((acc, part, i) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      const key = part.slice(1, -1)
      return { ...acc, [key]: path[i] }
    }
    return acc
  }, {})
}

/* Converts router.query objects with multiple key arrays
 * e.g. { topic: [ 'Physics', 'Chemistry' ] }
 * to [ [ 'topic', 'Physics' ], [ 'topic', 'Chemistry' ] ]
 * so that new URLSearchParams(value).toString()
 * produces topic=Physics&topic=Chemistry
 * and not topic=Physics%2CChemistry
 */
const convertObjectToUrlParams = (obj: ParsedUrlQuery): [string, string][] =>
  Object.entries(obj).flatMap(([key, value]) =>
    Array.isArray(value)
      ? value.map((v) => [key, v] as [string, string])
      : [[key, value] as [string, string]],
  )

/**
 * memoryRouter is a mock for the older pages router
 * this file adapts it for the app router
 * but older router had 3-arg push and replace (url, as, options)
 * new router has 2-arg (url, options).
 *
 * Our application code may call the 2-arg version which 2nd arg as options,
 * which causes problems for the mock. Let's just limit the mock to the first
 * argument. The options don't really make sense in a JSDom environment anyway.
 */
const originalPush = mocks.memoryRouter.push
const originalReplace = mocks.memoryRouter.replace
mocks.memoryRouter.push = (url) => originalPush(url)
mocks.memoryRouter.replace = (url) => originalReplace(url)

export const nextNavigationMocks = {
  ...mocks,
  notFound: jest.fn(),
  redirect: jest.fn().mockImplementation((url: string) => {
    nextNavigationMocks.memoryRouter.setCurrentUrl(url)
  }),
  usePathname: () => {
    const router = nextNavigationMocks.useRouter()
    /**
     * next-router-mock is designed for Pages router. We are adapting for App
     * router. The return value is a little different for the two:
     *  pages router: /dynamic/[id]
     *  app router:   /dynamic/123
     *
     * I.e., pages router returns the route "template".
     * App router returns similar to window.location.pathname
     */
    const url = new URL(router.asPath, "http://localhost")
    return url.pathname
  },
  useSearchParams: () => {
    const router = nextNavigationMocks.useRouter()

    const search = new URLSearchParams(convertObjectToUrlParams(router.query))

    return search
  },
  useParams: () => {
    const router = nextNavigationMocks.useRouter()
    const url = new URL(router.asPath, "http://localhost")
    return getParams(router.pathname, url.pathname)
  },
}

const mockRouter = nextNavigationMocks.memoryRouter
export { mockRouter, createDynamicRouteParser }
