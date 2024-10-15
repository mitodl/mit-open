import { act, renderHook } from "@testing-library/react"
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
    mockRouter.setCurrentUrl("/dynamic/bar?a=1&b=2")
    const { result } = renderHook(() => useSearchParams())
    expect(result.current.toString()).toEqual("a=1&b=2")
  })

  test("useSearchParams repeats duplicate keys on the querystring", () => {
    mockRouter.setCurrentUrl("/dynamic/bar?a=1&b=2&b=3")
    const { result } = renderHook(() => useSearchParams())
    expect(result.current.toString()).toEqual("a=1&b=2&b=3")
  })

  test("useParams returns the current params", () => {
    mockRouter.useParser(createDynamicRouteParser(["x"]))
    mockRouter.setCurrentUrl("/dynamic/bar/baz?a=1&b=2")
    const { result } = renderHook(() => nextNavigationMocks.useParams())
    expect(result.current).toEqual({ id: "bar", other: "baz" })
  })

  test("router.push", () => {
    mockRouter.useParser(createDynamicRouteParser(["x"]))
    mockRouter.setCurrentUrl("/dynamic/bar/baz?a=1&b=2")
    const { result } = renderHook(() => nextNavigationMocks.useRouter())
    act(() => {
      result.current.push(
        "/dynamic/foo?c=3",
        // @ts-expect-error The type signature of mockRouter.push is for old pages router.
        // The 2nd arg here is for what our application uses, the app router
        { scroll: false },
      )
    })
    expect(mockRouter.asPath).toBe("/dynamic/foo?c=3")
    act(() => {
      result.current.push("?d=4")
    })
    expect(mockRouter.asPath).toBe("/dynamic/foo?d=4")
  })

  test("router.replace", () => {
    mockRouter.useParser(createDynamicRouteParser(["x"]))
    mockRouter.setCurrentUrl("/dynamic/bar/baz?a=1&b=2")
    const { result } = renderHook(() => nextNavigationMocks.useRouter())
    act(() => {
      result.current.replace(
        "/dynamic/foo?c=3",
        // @ts-expect-error The type signature of mockRouter.replace is for old pages router.
        // The 2nd arg here is for what our application uses, the app router
        { scroll: false },
      )
    })
    expect(mockRouter.asPath).toBe("/dynamic/foo?c=3")
    act(() => {
      result.current.push("?d=4")
    })
    expect(mockRouter.asPath).toBe("/dynamic/foo?d=4")
  })

  test("useSearchParams reacts to history.pushState", () => {
    const { result } = renderHook(() => nextNavigationMocks.useSearchParams())
    expect(result.current.toString()).toBe("")
    const push = jest.spyOn(mockRouter, "push")
    act(() => {
      window.history.pushState({}, "", "/dynamic/foo?a=1&b=2")
    })
    expect(push).toHaveBeenCalled()
    expect(result.current.toString()).toBe("a=1&b=2")
  })

  test("useSearchParams reacts to history.replaceState", () => {
    const { result } = renderHook(() => nextNavigationMocks.useSearchParams())
    expect(result.current.toString()).toBe("")
    const replace = jest.spyOn(mockRouter, "replace")
    act(() => {
      window.history.replaceState({}, "", "/dynamic/foo?a=1&b=2")
    })
    expect(replace).toHaveBeenCalled()
    expect(result.current.toString()).toBe("a=1&b=2")
  })
})
