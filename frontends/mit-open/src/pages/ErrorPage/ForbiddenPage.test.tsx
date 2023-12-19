import React from "react"
import { waitFor } from "@testing-library/react"
import { renderWithProviders, screen } from "../../test-utils"
import { withFakeLocation } from "../../test-utils/withFakeLocation"
import { HOME } from "@/common/urls"
import ForbiddenPage from "./ForbiddenPage"

test("The ForbiddenPage loads with meta", async () => {
  renderWithProviders(<ForbiddenPage />, { user: { is_authenticated: true } })
  await waitFor(() => {
    expect(document.title).toBe("Not Allowed")
  })
  // eslint-disable-next-line testing-library/no-node-access
  const meta = document.head.querySelector('meta[name="robots"]')
  expect(meta).toHaveProperty("content", "noindex,noarchive")
})

test("The ForbiddenPage loads with Correct Title", () => {
  renderWithProviders(<ForbiddenPage />, { user: { is_authenticated: true } })
  screen.getByRole("heading", { name: "Not Allowed" })
})

test("The ForbiddenPage loads with a link that directs to HomePage", () => {
  renderWithProviders(<ForbiddenPage />, {
    user: { is_authenticated: true },
  })
  const homeLink = screen.getByRole("link", { name: "Home" })
  expect(homeLink).toHaveAttribute("href", HOME)
})

test("Redirects unauthenticated users to login", async () => {
  const initialUrl = "/current/page"
  const loc = await withFakeLocation(() => {
    jest.spyOn(window.location, "assign").mockImplementation(jest.fn())
    window.location.href = initialUrl
    renderWithProviders(<ForbiddenPage />, {
      user: { is_authenticated: false },
      url: initialUrl,
    })
  })

  expect(loc.assign).toHaveBeenCalledWith(`/login/ol-oidc/?next=${initialUrl}`)
})
