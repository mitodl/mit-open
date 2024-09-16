/**
 * This is a mock for the next/navigation module used with the App Router.
 *
 * NOTE: next-router-mock is intended to mock the next/router module (used with
 * older Pages router.)
 *
 * See https://github.com/scottrippey/next-router-mock/issues
 */
import * as mocks from "next-router-mock"
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
    const url = new URL(router.asPath, "http://localhost")
    return url.searchParams
  },
  useParams: () => {
    const router = nextNavigationMocks.useRouter()
    const url = new URL(router.asPath, "http://localhost")
    return getParams(router.pathname, url.pathname)
  },
}

const mockRouter = nextNavigationMocks.memoryRouter
export { mockRouter, createDynamicRouteParser }
