/**
 * This is a mock for the next/navigation module used with the App Router.
 *
 * NOTE: next-router-mock is intended to mock the next/router module (used with
 * older Pages router.)
 *
 * See https://github.com/scottrippey/next-router-mock/issues
 */
import * as mocks from "next-router-mock"

type ParsedUrlQuery = typeof mocks.memoryRouter.query

const nextRouterQueryToSearchParams = (
  query: ParsedUrlQuery,
): URLSearchParams => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v))
    } else {
      params.append(key, value ?? "")
    }
  })
  return params
}

export const nextNavigationMocks = {
  ...mocks,
  notFound: jest.fn(),
  redirect: jest.fn().mockImplementation((url: string) => {
    nextNavigationMocks.memoryRouter.setCurrentUrl(url)
  }),
  usePathname: () => {
    const router = nextNavigationMocks.useRouter()
    return router.pathname
  },
  useSearchParams: () => {
    const router = nextNavigationMocks.useRouter()
    return nextRouterQueryToSearchParams(router.query)
  },
}
const mockRouter = nextNavigationMocks.memoryRouter
export { mockRouter, nextRouterQueryToSearchParams }
