import { RoutedDrawer } from "./RoutedDrawer"
import type { RoutedDrawerProps } from "./RoutedDrawer"
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react"
import user from "@testing-library/user-event"
import React from "react"
import { ThemeProvider } from "../ThemeProvider/ThemeProvider"
import { mockRouter } from "ol-test-utilities/mocks/nextNavigation"

const TestDrawerContents = ({ closeDrawer }: { closeDrawer: () => void }) => (
  <section>
    <h2>DrawerContent</h2>
    <button type="button" onClick={closeDrawer}>
      CloseFn
    </button>
  </section>
)
const getDrawerContent = () =>
  screen.getByRole("heading", { name: "DrawerContent" })

const renderRoutedDrawer = <P extends string, R extends P>(
  props: Omit<RoutedDrawerProps<P, R>, "children">,
  initialSearchParams: string,
  initialHashParams: string,
) => {
  mockRouter.setCurrentUrl(`/?${initialSearchParams}#${initialHashParams}`)
  window.location.hash = initialHashParams
  const childFn = jest.fn(TestDrawerContents)
  render(<RoutedDrawer {...props}>{childFn}</RoutedDrawer>, {
    wrapper: ThemeProvider,
  })
  return { childFn }
}

describe("RoutedDrawer", () => {
  it.each([
    {
      params: ["a", "b", "c"],
      requiredParams: ["a", "b"],
      initialSearch: "a=1",
      called: false,
    },
    {
      params: ["a", "b"],
      requiredParams: ["a", "b"],
      initialSearch: "a=1&b=2",
      called: true,
    },
    {
      params: ["a", "b", "c"],
      requiredParams: ["a", "b"],
      initialSearch: "a=1&b=2",
      called: true,
    },
  ])(
    "Calls childFn if and only all required params are present in URL",
    ({ params, requiredParams, initialSearch, called }) => {
      const { childFn } = renderRoutedDrawer(
        { params, requiredParams },
        initialSearch,
        "",
      )
      expect(childFn.mock.calls.length > 0).toBe(called)
    },
  )

  it.each([
    {
      params: ["a", "b", "c"],
      requiredParams: ["a", "b"],
      initialSearch: "a=1&b=2&c=3&d=4",
      childProps: {
        params: { a: "1", b: "2", c: "3" },
        closeDrawer: expect.any(Function),
      },
    },
    {
      params: ["a", "b", "c"],
      requiredParams: ["a", "b"],
      initialSearch: "a=1&b=2&d=4",
      childProps: {
        params: { a: "1", b: "2", c: null },
        closeDrawer: expect.any(Function),
      },
    },
  ])(
    "Calls childFn with only the params specified in props.params",
    ({ params, requiredParams, initialSearch, childProps }) => {
      const { childFn } = renderRoutedDrawer(
        { params, requiredParams },
        initialSearch,
        "",
      )
      expect(childFn).toHaveBeenCalledWith(childProps)
    },
  )

  it("Includes a close button that closes drawer", async () => {
    const params = ["a"]
    const requiredParams = ["a"]
    const initialSearch = "a=1"
    renderRoutedDrawer({ params, requiredParams }, initialSearch, "")

    const content = getDrawerContent()

    await user.click(screen.getByRole("button", { name: "CloseFn" }))

    await waitForElementToBeRemoved(content)

    expect(mockRouter.query).toEqual({})
  })

  it("Passes a closeDrawer callback to child that can close the drawer", async () => {
    const params = ["a"]
    const requiredParams = ["a"]
    const initialSearch = "a=1"
    renderRoutedDrawer({ params, requiredParams }, initialSearch, "")

    const content = getDrawerContent()
    await user.click(screen.getByRole("button", { name: "Close" }))
    await waitForElementToBeRemoved(content)

    expect(mockRouter.query).toEqual({})
  })

  it("Restores any hash params that were in the initial request", async () => {
    const params = ["a"]
    const requiredParams = ["a"]
    const initialSearch = "a=1"
    const initialHashParams = "test"
    renderRoutedDrawer(
      { params, requiredParams },
      initialSearch,
      initialHashParams,
    )

    const content = getDrawerContent()
    await user.click(screen.getByRole("button", { name: "CloseFn" }))

    await waitForElementToBeRemoved(content)
    expect(mockRouter.hash).toBe(`#${initialHashParams}`)
  })
})
