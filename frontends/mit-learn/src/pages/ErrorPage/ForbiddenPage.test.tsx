import React from "react"
import { waitFor } from "@testing-library/react"
import { renderWithProviders, screen } from "../../test-utils"
import { HOME, login } from "@/common/urls"
import ForbiddenPage from "./ForbiddenPage"
import { setMockResponse, urls } from "api/test-utils"
import { Permissions } from "@/common/permissions"

const oldWindowLocation = window.location

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).location

  window.location = Object.defineProperties({} as Location, {
    ...Object.getOwnPropertyDescriptors(oldWindowLocation),
    assign: {
      configurable: true,
      value: jest.fn(),
    },
  })
})

afterAll(() => {
  window.location = oldWindowLocation
})

test("The ForbiddenPage loads with meta", async () => {
  setMockResponse.get(urls.userMe.get(), {
    [Permissions.Authenticated]: true,
  })
  renderWithProviders(<ForbiddenPage />)
  await waitFor(() => {
    expect(document.title).toBe("Not Allowed | MIT Learn")
  })

  const meta = document.head.querySelector('meta[name="robots"]')
  expect(meta).toHaveProperty("content", "noindex,noarchive")
})

test("The ForbiddenPage loads with Correct Title", () => {
  setMockResponse.get(urls.userMe.get(), {
    [Permissions.Authenticated]: true,
  })
  renderWithProviders(<ForbiddenPage />)
  screen.getByRole("heading", { name: "Not Allowed" })
})

test("The ForbiddenPage loads with a link that directs to HomePage", () => {
  setMockResponse.get(urls.userMe.get(), {
    [Permissions.Authenticated]: true,
  })
  renderWithProviders(<ForbiddenPage />)
  const homeLink = screen.getByRole("link", { name: "Home" })
  expect(homeLink).toHaveAttribute("href", HOME)
})

test("Redirects unauthenticated users to login", async () => {
  setMockResponse.get(urls.userMe.get(), {
    [Permissions.Authenticated]: false,
  })
  renderWithProviders(<ForbiddenPage />, { url: "/some/url?foo=bar#baz" })

  const expectedUrl = login({
    pathname: "/some/url",
    search: "?foo=bar",
    hash: "#baz",
  })
  expect(window.location.assign).toHaveBeenCalledWith(expectedUrl)
})
