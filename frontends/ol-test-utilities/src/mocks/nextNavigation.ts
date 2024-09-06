/**
 * This is a mock for the next/navigation module used with the App Router.
 *
 * NOTE: next-router-mock is intended to mock the next/router module (used with
 * older Pages router.)
 */
import * as mocks from "next-router-mock"

export const nextNavigationMocks = {
  ...mocks,
  notFound: jest.fn(),
  redirect: jest.fn().mockImplementation((url: string) => {
    nextNavigationMocks.memoryRouter.setCurrentUrl(url)
  }),
  usePathname: () => {
    const router = nextNavigationMocks.useRouter()
    return router.asPath
  },
  useSearchParams: () => {
    const router = nextNavigationMocks.useRouter()
    const path = router.query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new URLSearchParams(path as any)
  },
}
const mockRouter = nextNavigationMocks.memoryRouter
export { mockRouter }
