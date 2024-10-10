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

/**
 * next-mock-router is designed for Pages router; we are adapting for App router.
 * App router does not change pathname when pushing / replacing an href that
 * starts with `?`.
 */
const prependPathIfNeeded = (url: mocks.Url) => {
  if (typeof url === "string") {
    const current = new URL(mockRouter.asPath, "http://localhost")
    return url.startsWith("?") ? `${current.pathname}${url}` : url
  }
  return url // App router only supports strings anyway
}
mocks.memoryRouter.push = (url) => originalPush(prependPathIfNeeded(url))
mocks.memoryRouter.replace = (url) => originalReplace(prependPathIfNeeded(url))

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

/**
 * next-router-mock is built for the old NextJS Pages router, which included
 * a { shallow: true } option on push/replace to force fully client-side routing.
 *
 * We're adapting next-router-mock for the NextJS App router, which removed
 * the shallow option in favor of direct usage of window.history.pushState
 * and window.history.replaceState for client-side routing.
 *
 * We patch history.pushState and history.replaceState to update the mock router
 *
 * Note: This is similar to what NextJS actually does for the App router.
 * See https://github.com/vercel/next.js/blob/a52dcd54b0e419690dfedde53d09c66d71487c06/packages/next/src/client/components/app-router.tsx#L455
 */
const patchHistoryPushReplace = () => {
  const originalPushState = window.history.pushState.bind(window.history)
  window.history.pushState = (data, _unused: never, url) => {
    originalPushState(data, "", url)
    if (url === undefined || url === null) return
    nextNavigationMocks.memoryRouter.push(url)
  }
  const originalReplaceState = window.history.replaceState.bind(window.history)
  window.history.replaceState = (data, _unused: never, url) => {
    originalReplaceState(data, "", url)
    if (url === undefined || url === null) return
    nextNavigationMocks.memoryRouter.replace(url)
  }
}

const originalSetCurrentUrl = mocks.memoryRouter.setCurrentUrl
mocks.memoryRouter.setCurrentUrl = (url) => {
  // This sets it on the memoryRouter
  originalSetCurrentUrl(url)
  // Below we set it on window.location
  const urlObject =
    typeof url === "string" ? new URL(url, "http://localhost") : url
  const pathName = urlObject.pathname ?? ""
  const search = urlObject.search ?? ""
  window.history.replaceState({}, "", pathName + search)
}

patchHistoryPushReplace()
const mockRouter = nextNavigationMocks.memoryRouter
export { mockRouter, createDynamicRouteParser }
