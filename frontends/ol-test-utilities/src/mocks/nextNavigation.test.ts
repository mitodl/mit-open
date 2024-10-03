import { renderHook } from "@testing-library/react"
import { nextNavigationMocks } from "./nextNavigation"
import mockRouter from "next-router-mock"
import { createDynamicRouteParser } from "next-router-mock/dynamic-routes"

const { usePathname, useSearchParams } = nextNavigationMocks

describe("Mock Navigation", () => {
  beforeAll(() => {
    mockRouter.useParser(
      createDynamicRouteParser([
        "/dynamic/[id]",
        "/dynamic/[id]/[other]",
        "/static/path",
      ]),
    )
  })

  afterAll(() => {
    mockRouter.useParser(
      createDynamicRouteParser([
        // These paths should match those found in the `/pages` folder:
        "/dynamic/[id]",
        "/dynamic/[id]/[other]",
        "/static/path",
      ]),
    )
  })

  test("usePathname returns the current pathname", () => {
    mockRouter.setCurrentUrl("/dynamic/bar?a=1&b=2")
    const { result } = renderHook(() => usePathname())
    expect(result.current).toBe("/dynamic/bar")
  })

  test("useSearchParams returns the current search params", () => {
    mockRouter.setCurrentUrl("/dynamic/bar?a=1&b=2&b=3")
    const { result } = renderHook(() => useSearchParams())
    expect(result.current.toString()).toEqual("a=1&b=2%2C3&id=bar")
  })

  test("useParams returns the current params", () => {
    mockRouter.useParser(createDynamicRouteParser(["x"]))
    mockRouter.setCurrentUrl("/dynamic/bar/baz?a=1&b=2")
    const { result } = renderHook(() => nextNavigationMocks.useParams())
    expect(result.current).toEqual({ id: "bar", other: "baz" })
  })
})
